import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
}));

/** Next's `redirect` / `forbidden` throw to interrupt rendering; model them as tagged errors. */
vi.mock("next/navigation", () => ({
  redirect: (to: string): never => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { redirectTo: to });
  },
  forbidden: (): never => {
    throw Object.assign(new Error("NEXT_FORBIDDEN"), { forbidden: true });
  },
}));
vi.mock("react", async (importOriginal) => ({ ...(await importOriginal<typeof import("react")>()), cache: <T,>(fn: T) => fn }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db.server", () => ({ getPrisma: async () => ({ appUser: { findUnique: mocks.findUnique } }) }));

import { canVisitRoutePrefix } from "@sunschool/policy-edge";
import { requireActiveUser, requireRole, requireSession } from "./require-user";

const row = (status: string, roles: string[]) => ({ id: "u1", status, roles: roles.map((role) => ({ role })) });
const outcome = async (run: () => Promise<unknown>) => {
  try {
    return { ok: true as const, value: await run() };
  } catch (error) {
    const tagged = error as { redirectTo?: string; forbidden?: boolean };
    if (tagged.redirectTo !== undefined) return { ok: false as const, redirectTo: tagged.redirectTo };
    if (tagged.forbidden) return { ok: false as const, forbidden: true };
    throw error;
  }
};

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.findUnique.mockReset();
});

describe("requireSession (AZ-D1)", () => {
  it("redirects an anonymous visitor to /login", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await outcome(requireSession)).toEqual({ ok: false, redirectTo: "/login" });
  });

  it("returns the uid of the session", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    expect(await outcome(requireSession)).toEqual({ ok: true, value: { uid: "u1" } });
  });
});

describe("requireActiveUser (AZ-D2, AZ-D5): status and roles come from the database", () => {
  beforeEach(() => mocks.auth.mockResolvedValue({ user: { id: "u1", status: "ACTIVE", roles: ["ADMIN"] } }));

  it("returns the context of an ACTIVE user, built from the DB row (not the JWT)", async () => {
    mocks.findUnique.mockResolvedValue(row("ACTIVE", ["TEACHER"]));
    expect(await outcome(requireActiveUser)).toEqual({
      ok: true,
      value: { userId: "u1", status: "ACTIVE", roles: ["TEACHER"] },
    });
  });

  it.each([
    ["REGISTRATION", "/register"],
    ["REQUEST_PENDING", "/pending"],
    ["REJECTED", "/pending"],
  ])("sends %s to its home route %s", async (status, to) => {
    mocks.findUnique.mockResolvedValue(row(status, []));
    expect(await outcome(requireActiveUser)).toEqual({ ok: false, redirectTo: to });
  });

  it.each(["DISABLED", "DELETED"])(
    "sends %s (JWT still ACTIVE) to the terminal error page: no redirect loop",
    async (status) => {
      mocks.findUnique.mockResolvedValue(row(status, []));
      const result = await outcome(requireActiveUser);
      expect(result).toEqual({ ok: false, redirectTo: "/login?error=AccessDenied" });
      // the proxy keeps exactly this target open for an ACTIVE JWT
      expect(canVisitRoutePrefix({ userId: "u1", status: "ACTIVE", roles: ["ADMIN"] }, "/login?error=AccessDenied")).toEqual({ kind: "allow" });
    },
  );

  it("sends a user whose row is gone to the terminal error page as well", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await outcome(requireActiveUser)).toEqual({ ok: false, redirectTo: "/login?error=AccessDenied" });
  });

  it("takes the userId only from the session", async () => {
    mocks.findUnique.mockResolvedValue(row("ACTIVE", ["ADMIN"]));
    await outcome(requireActiveUser);
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "u1" } }));
  });
});

describe("requireRole (AZ-D3, AZ-D5)", () => {
  it("allows a user who holds the role", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.findUnique.mockResolvedValue(row("ACTIVE", ["ADMIN"]));
    expect((await outcome(() => requireRole("ADMIN"))).ok).toBe(true);
  });

  it("forbids a teacher on an admin requirement (403, not a redirect)", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.findUnique.mockResolvedValue(row("ACTIVE", ["TEACHER"]));
    expect(await outcome(() => requireRole("ADMIN"))).toEqual({ ok: false, forbidden: true });
  });

  it("a stale JWT that says ADMIN does not help when the DB says TEACHER", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", status: "ACTIVE", roles: ["ADMIN"] } });
    mocks.findUnique.mockResolvedValue(row("ACTIVE", ["TEACHER"]));
    expect(await outcome(() => requireRole("ADMIN"))).toEqual({ ok: false, forbidden: true });
  });

  it("an anonymous visitor is sent to /login before any role check", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await outcome(() => requireRole("ADMIN"))).toEqual({ ok: false, redirectTo: "/login" });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
