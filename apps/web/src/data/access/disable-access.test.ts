import { describe, expect, it, vi } from "vitest";
import { ACCOUNT_STATUS, MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { disableAccess } from "./disable-access";

const targetUserId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";

describe("disableAccess", () => {
  it("returns ACCESS_LAST_ADMIN when target is the only admin", async () => {
    const tx = {
      $queryRaw: vi.fn(),
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: targetUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          organizationId: "org",
        }),
        update: vi.fn(),
      },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-1" }),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await disableAccess(db as never, actorUserId, { userId: targetUserId });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_LAST_ADMIN,
      message: "admin.users.last_admin",
    });
    expect(tx.appUser.update).not.toHaveBeenCalled();
  });

  it("allows disable when another admin remains", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: targetUserId }]),
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: targetUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          organizationId: "org",
        }),
        update: vi.fn(),
      },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-1" }),
        count: vi.fn().mockResolvedValue(2),
      },
      auditLog: { create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await disableAccess(db as never, actorUserId, { userId: targetUserId });

    expect(result).toEqual({ ok: true });
    expect(tx.userRoleAssignment.findFirst).toHaveBeenCalledWith({
      where: { userId: targetUserId, role: USER_ROLE.ADMIN },
      select: { id: true },
    });
  });
});
