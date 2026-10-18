import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  DELETION_PLAN_WARNING,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
} from "@sunschool/domain";
import { previewDeletionPlanInTransaction } from "./preview-plan";

const actorUserId = "33333333-3333-4333-8333-333333333333";
const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const subjectUserId = "44444444-4444-4444-8444-444444444444";
const orgId = "22222222-2222-4222-8222-222222222222";

vi.mock("../access/access-admin-guards.server", () => ({
  userHasAdminRole: vi.fn(),
  countAdminRoles: vi.fn(),
}));

vi.mock("../access/active-academic-year.server", () => ({
  loadActiveAcademicYearId: vi.fn(),
}));

import { countAdminRoles, userHasAdminRole } from "../access/access-admin-guards.server";
import { loadActiveAcademicYearId } from "../access/active-academic-year.server";

describe("previewDeletionPlanInTransaction (deletion_requests §5.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userHasAdminRole).mockResolvedValue(true);
    vi.mocked(countAdminRoles).mockResolvedValue(2);
    vi.mocked(loadActiveAcademicYearId).mockResolvedValue("year-1");
  });

  it("forbids non-admin (AZ-07)", async () => {
    vi.mocked(userHasAdminRole).mockResolvedValue(false);
    const result = await previewDeletionPlanInTransaction(
      {} as never,
      actorUserId,
      { requestId },
    );
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
  });

  it("builds account plan inside the transaction from live counts", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: requestId,
          status: DELETION_REQUEST_STATUS.NEW,
          requestedById: actorUserId,
          subjectUserId,
          subjectPupilId: null,
        },
      ]),
      deletionRequest: {
        findUnique: vi.fn().mockResolvedValue({
          type: DELETION_REQUEST_TYPE.ACCOUNT,
          subjectUserId,
          subjectPupilId: null,
        }),
      },
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          status: ACCOUNT_STATUS.ACTIVE,
          organizationId: orgId,
        }),
      },
      loginIdentity: { count: vi.fn().mockResolvedValue(2) },
      userRoleAssignment: { count: vi.fn().mockResolvedValue(1) },
      teacherAssignment: {
        count: vi
          .fn()
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(1),
      },
      privacyConsent: { count: vi.fn().mockResolvedValue(1) },
      accessRequest: { count: vi.fn().mockResolvedValue(0) },
      auditLog: { count: vi.fn().mockResolvedValue(3) },
      lesson: { count: vi.fn().mockResolvedValue(2) },
    };

    vi.mocked(userHasAdminRole)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    const result = await previewDeletionPlanInTransaction(tx as never, actorUserId, { requestId });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.plan.warnings).toContain(DELETION_PLAN_WARNING.TEACHER_ASSIGNED_ACTIVE_YEAR);
    expect(result.data.plan.warnings).toContain(DELETION_PLAN_WARNING.INCOMPLETE_HOMEWORK_CHECKS);
    expect(tx.loginIdentity.count).toHaveBeenCalled();
  });
});
