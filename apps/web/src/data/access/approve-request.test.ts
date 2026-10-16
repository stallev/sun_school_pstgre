import { describe, expect, it, vi } from "vitest";
import {
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  MUTATION_WARNING_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { approveRequest } from "./approve-request";

const requestId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const orgId = "33333333-3333-4333-8333-333333333333";

describe("approveRequest", () => {
  it("returns ACCESS_REQUEST_DECIDED when the request is not pending", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([
        { id: requestId, status: ACCESS_REQUEST_STATUS.APPROVED, userId },
      ]),
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await approveRequest(db as never, "admin-id", {
      requestId,
      roles: [USER_ROLE.TEACHER],
    }, new Date());

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_REQUEST_DECIDED,
      message: "admin.approvals.already_decided",
    });
  });

  it("returns NO_GROUPS warning for teacher without grades", async () => {
    const tx = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: requestId, status: ACCESS_REQUEST_STATUS.PENDING, userId }])
        .mockResolvedValueOnce([{ id: userId }]),
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ status: ACCOUNT_STATUS.REQUEST_PENDING, organizationId: orgId }),
        update: vi.fn(),
      },
      accessRequest: { update: vi.fn() },
      userRoleAssignment: { deleteMany: vi.fn(), create: vi.fn() },
      teacherAssignment: { deleteMany: vi.fn(), upsert: vi.fn() },
      academicYear: { findFirst: vi.fn().mockResolvedValue(null) },
      gradeSettings: { count: vi.fn() },
      auditLog: { create: vi.fn() },
    };

    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await approveRequest(db as never, "admin-id", {
      requestId,
      roles: [USER_ROLE.TEACHER],
      gradeIds: [],
    }, new Date());

    expect(result).toEqual({ ok: true, warnings: [MUTATION_WARNING_CODES.NO_GROUPS] });
  });

  it("returns ACCESS_ROLE_UNAVAILABLE when PARENT is in roles", async () => {
    const db = { $transaction: vi.fn() };
    const result = await approveRequest(db as never, "admin-id", {
      requestId,
      roles: [USER_ROLE.PARENT],
    }, new Date());
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_ROLE_UNAVAILABLE,
      message: "admin.approvals.parent_unavailable",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
