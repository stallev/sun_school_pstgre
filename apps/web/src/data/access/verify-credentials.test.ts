import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, type PrismaClient } from "@sunschool/db";
import { verifyCredentials } from "./verify-credentials";

type Identity = {
  id: string;
  passwordHash: string | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  user: { id: string; status: string; firstLoginAt: Date | null };
};

/** In-memory stand-in for the three Prisma calls the use-case makes. */
const makeDb = (identity: Identity | null) => {
  const store = { identity, userUpdates: [] as unknown[] };
  const db = {
    loginIdentity: {
      findUnique: async () => (store.identity ? { ...store.identity } : null),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        const current = store.identity as Identity;
        const attempts = data.failedAttempts;
        if (typeof attempts === "object" && attempts !== null) current.failedAttempts += (attempts as { increment: number }).increment;
        else if (typeof attempts === "number") current.failedAttempts = attempts;
        if ("lockedUntil" in data) current.lockedUntil = data.lockedUntil as Date | null;
        return { ...current };
      },
    },
    appUser: {
      update: async (args: unknown) => {
        store.userUpdates.push(args);
        return {};
      },
    },
  } as unknown as Pick<PrismaClient, "loginIdentity" | "appUser">;
  return { db, store };
};

const NOW = new Date("2026-10-16T10:00:00.000Z");
let hash: string;
beforeAll(async () => {
  hash = await hashPassword("correct-password-1");
}, 60_000);

const admin = (overrides: Partial<Identity> = {}): Identity => ({
  id: "i1",
  passwordHash: hash,
  failedAttempts: 0,
  lockedUntil: null,
  user: { id: "u1", status: "ACTIVE", firstLoginAt: null },
  ...overrides,
});

describe("verifyCredentials (auth_runtime_spec §4.4)", () => {
  it("accepts the right password, normalises the email and records the login", async () => {
    const { db, store } = makeDb(admin({ failedAttempts: 3 }));
    const result = await verifyCredentials(db, { email: "  Admin@Example.ORG ", password: "correct-password-1" }, NOW);
    expect(result).toEqual({ ok: true, uid: "u1" });
    expect(store.identity?.failedAttempts).toBe(0);
    expect(store.userUpdates).toHaveLength(1);
  }, 60_000);

  it("gives the same answer for an unknown email and a wrong password", async () => {
    const wrong = await verifyCredentials(makeDb(admin()).db, { email: "a@b.co", password: "nope-nope-nope" }, NOW);
    const unknown = await verifyCredentials(makeDb(null).db, { email: "a@b.co", password: "nope-nope-nope" }, NOW);
    expect(wrong).toEqual({ ok: false, reason: "bad_credentials" });
    expect(unknown).toEqual(wrong);
  }, 60_000);

  it("rejects malformed input as a bad login", async () => {
    expect(await verifyCredentials(makeDb(null).db, { email: "not-an-email", password: "" }, NOW)).toEqual({
      ok: false,
      reason: "bad_credentials",
    });
    expect(await verifyCredentials(makeDb(null).db, undefined, NOW)).toEqual({ ok: false, reason: "bad_credentials" });
  }, 60_000);

  it("locks for 15 minutes on the fifth consecutive failure and refuses even the right password while locked", async () => {
    const { db, store } = makeDb(admin());
    const results = [];
    for (let i = 0; i < 5; i += 1) {
      results.push(await verifyCredentials(db, { email: "a@b.co", password: "wrong-password-1" }, NOW));
    }
    expect(results.slice(0, 4).every((r) => !r.ok && r.reason === "bad_credentials")).toBe(true);
    expect(results[4]).toEqual({ ok: false, reason: "locked" });
    expect(store.identity?.lockedUntil?.getTime()).toBe(NOW.getTime() + 15 * 60_000);

    const rightWhileLocked = await verifyCredentials(db, { email: "a@b.co", password: "correct-password-1" }, NOW);
    expect(rightWhileLocked).toEqual({ ok: false, reason: "locked" });

    const afterLock = new Date(NOW.getTime() + 15 * 60_000 + 1);
    expect(await verifyCredentials(db, { email: "a@b.co", password: "correct-password-1" }, afterLock)).toEqual({
      ok: true,
      uid: "u1",
    });
    expect(store.identity?.lockedUntil).toBeNull();
  }, 120_000);

  it("refuses DISABLED and DELETED administrators without touching the counter", async () => {
    for (const status of ["DISABLED", "DELETED"]) {
      const { db, store } = makeDb(admin({ user: { id: "u1", status, firstLoginAt: null } }));
      const result = await verifyCredentials(db, { email: "a@b.co", password: "correct-password-1" }, NOW);
      expect(result).toEqual({ ok: false, reason: "bad_credentials" });
      expect(store.identity?.failedAttempts).toBe(0);
      // a wrong password on a disabled account does not count either
      await verifyCredentials(db, { email: "a@b.co", password: "wrong-password-1" }, NOW);
      expect(store.identity?.failedAttempts).toBe(0);
    }
  }, 120_000);

  it("a Telegram-only user (no password hash) cannot sign in by password", async () => {
    const { db } = makeDb(admin({ passwordHash: null }));
    expect(await verifyCredentials(db, { email: "a@b.co", password: "anything-123456" }, NOW)).toEqual({
      ok: false,
      reason: "bad_credentials",
    });
  }, 60_000);
});
