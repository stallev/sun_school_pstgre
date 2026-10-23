import { describe, expect, it, vi } from "vitest";
import {
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  MUTATION_WARNING_CODES,
  PARENT_APPROVAL_LINK_MODE,
  USER_ROLE,
} from "@sunschool/domain";
import * as approveParentRequest from "./approve-parent-request";
import { approveRequest, approveRequestInTransaction } from "./approve-request";

const requestId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const orgId = "33333333-3333-4333-8333-333333333333";

const parentsFeatureOff = () => ({
  appSetting: { findUnique: vi.fn().mockResolvedValue({ value: false }) },
});

describe("approveRequest", () => {
  it("returns ACCESS_REQUEST_DECIDED when the request is not pending", async () => {
    const tx = {
      ...parentsFeatureOff(),
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
      ...parentsFeatureOff(),
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

  it("approves TEACHER with gradeIds on active year without NO_GROUPS warning", async () => {
    const gradeId = "44444444-4444-4444-8444-444444444444";
    const tx = {
      ...parentsFeatureOff(),
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
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({ id: "55555555-5555-4555-8555-555555555555" }),
      },
      gradeSettings: { count: vi.fn().mockResolvedValue(1) },
      auditLog: { create: vi.fn() },
    };

    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await approveRequest(db as never, "admin-id", {
      requestId,
      roles: [USER_ROLE.TEACHER],
      gradeIds: [gradeId],
    }, new Date());

    expect(result).toEqual({ ok: true });
    expect(tx.gradeSettings.count).toHaveBeenCalled();
  });

  it("does not activate user or assign PARENT when family link fails", async () => {
    const adultId = "66666666-6666-4666-8666-666666666666";
    vi.spyOn(approveParentRequest, "approveParentRequestInTransaction").mockResolvedValue({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });

    const tx = {
      ...parentsFeatureOff(),
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
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

    const result = await approveRequestInTransaction(
      tx as never,
      "admin-id",
      {
        requestId,
        roles: [USER_ROLE.PARENT],
        gradeIds: [],
        parentLink: { mode: PARENT_APPROVAL_LINK_MODE.LINK_EXISTING_ADULT, adultId },
      },
      new Date(),
      true,
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
    expect(tx.appUser.update).not.toHaveBeenCalled();
    expect(tx.accessRequest.update).not.toHaveBeenCalled();
    expect(tx.userRoleAssignment.create).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("returns ACCESS_ROLE_UNAVAILABLE when PARENT is in roles and flag is off", async () => {
    const tx = parentsFeatureOff();
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const result = await approveRequest(db as never, "admin-id", {
      requestId,
      roles: [USER_ROLE.PARENT],
    }, new Date());
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_ROLE_UNAVAILABLE,
      message: "admin.approvals.parent_unavailable",
    });
  });
});
