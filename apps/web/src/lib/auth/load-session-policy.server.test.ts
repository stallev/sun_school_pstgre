import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  cacheStore: new Map<string, unknown>(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => {
      const wrapped = ((...args: Parameters<T>) => {
        const key = `${String(fn)}:${JSON.stringify(args)}`;
        if (mocks.cacheStore.has(key)) {
          return mocks.cacheStore.get(key) as ReturnType<T>;
        }
        const result = fn(...args);
        mocks.cacheStore.set(key, result);
        return result;
      }) as T;
      return wrapped;
    },
  };
});
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db.server", () => ({ getPrisma: async () => ({ appUser: { findUnique: mocks.findUnique } }) }));

import { loadAppUserPolicyRow, loadPolicyContext } from "./require-user";
import { loadSessionPolicyContext } from "./load-session-policy.server";
import { getShellUser } from "@/data/shell/get-shell-user.server";
import { ACCOUNT_STATUS } from "@sunschool/domain";

const row = {
  id: "u1",
  status: ACCOUNT_STATUS.ACTIVE,
  firstName: "Ivan",
  lastName: "Ivanov",
  middleName: "",
  roles: [{ role: "ADMIN" }],
};

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.findUnique.mockReset();
  mocks.cacheStore.clear();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.findUnique.mockResolvedValue(row);
});

describe("shared app_user read (ADR-019 §4 п. 4)", () => {
  it("hits findUnique once when policy loaders and shell name run together", async () => {
    await Promise.all([loadSessionPolicyContext(), loadPolicyContext("u1"), getShellUser("u1")]);
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });

  it("reflects a status change on the next request (React cache cleared)", async () => {
    mocks.findUnique.mockResolvedValueOnce(row);
    const first = await loadPolicyContext("u1");
    mocks.cacheStore.clear();
    mocks.findUnique.mockResolvedValueOnce({ ...row, status: ACCOUNT_STATUS.DISABLED });
    const second = await loadPolicyContext("u1");
    expect(first?.status).toBe(ACCOUNT_STATUS.ACTIVE);
    expect(second?.status).toBe(ACCOUNT_STATUS.DISABLED);
  });

  it("loads display name from the same select as policy context", async () => {
    const shell = await getShellUser("u1");
    expect(shell.displayName).toContain("Ivanov");
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ firstName: true, lastName: true, status: true }),
      }),
    );
  });
});

describe("loadAppUserPolicyRow export", () => {
  it("dedupes repeated reads for one user id within one request", async () => {
    await loadAppUserPolicyRow("u1");
    await loadAppUserPolicyRow("u1");
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });
});
