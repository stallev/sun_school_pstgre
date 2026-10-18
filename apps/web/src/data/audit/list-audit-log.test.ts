import { describe, expect, it, vi } from "vitest";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { listAuditLog } from "./list-audit-log";

const actorUserId = "55555555-5555-4555-8555-555555555555";
const adminDict = {
  audit: {
    system_actor: "System",
    entity_pupil_erased: "Child (data erased)",
    entity_types: { app_user: "User", pupil: "Pupil" },
    actions: { "access.request_approved": "Request approved" },
  },
};
const commonDict = { person: { deleted_user: "Deleted user #{ordinal}" } };

describe("listAuditLog", () => {
  it("returns FORBIDDEN when actor is not admin (change_log §9)", async () => {
    const tx = {
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
      auditLog: { findMany: vi.fn() },
    };

    const result = await listAuditLog(
      db as never,
      actorUserId,
      {},
      {},
      adminDict as never,
      commonDict as never,
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
    expect(db.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("applies actor and action filters and returns cursor", async () => {
    const occurredAt = new Date("2026-01-15T12:00:00.000Z");
    const row = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      occurredAt,
      actorUserId,
      source: "USER",
      entityType: AUDIT_ENTITY_TYPE.ACCESS_REQUEST,
      entityId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      action: AUDIT_ACTION.ACCESS_REQUEST_APPROVED,
      oldValue: null,
      newValue: { roles: [USER_ROLE.TEACHER] },
      reason: null,
    };
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role", role: USER_ROLE.ADMIN }),
      },
    };
    const findMany = vi.fn().mockResolvedValue([row, { ...row, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }]);
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
      auditLog: { findMany },
      appUser: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: actorUserId,
            status: "ACTIVE",
            deletedOrdinal: null,
            firstName: "A",
            lastName: "Admin",
            middleName: null,
          },
        ]),
      },
    };

    const result = await listAuditLog(
      db as never,
      actorUserId,
      { actorUserId, action: AUDIT_ACTION.ACCESS_REQUEST_APPROVED },
      { limit: 1 },
      adminDict as never,
      commonDict as never,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.entries).toHaveLength(1);
    expect(result.data.nextCursor).toBe(`2026-01-15T12:00:00.000Z|${row.id}`);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          actorUserId,
          action: AUDIT_ACTION.ACCESS_REQUEST_APPROVED,
        },
        take: 2,
      }),
    );
  });
});
