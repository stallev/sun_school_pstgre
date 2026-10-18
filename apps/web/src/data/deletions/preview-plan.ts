import "server-only";

import {
  ACCOUNT_STATUS,
  DELETION_REQUEST_TYPE,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
  buildDeletionPlan,
  deletionRequestIdInputSchema,
  type AccountDeletionPlanInput,
  type ChildDeletionPlanInput,
  type DeletionPlan,
  type DeletionRequestIdInput,
  type MutationResult,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import {
  countAdminRoles,
  userHasAdminRole,
} from "../access/access-admin-guards.server";
import { loadActiveAcademicYearId } from "../access/active-academic-year.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { lockDeletionRequest } from "./deletion-shared.server";

type Tx = Prisma.TransactionClient;

export async function gatherAccountPlanInput(
  tx: Tx,
  userId: string,
  organizationId: string,
): Promise<AccountDeletionPlanInput> {
  const activeYearId = await loadActiveAcademicYearId(tx, organizationId);

  const [
    loginIdentityCount,
    userRoleCount,
    teacherAssignmentCount,
    privacyConsentCount,
    accessRequestCount,
    auditLogUserTextCount,
    activeYearAssignments,
    lessonsWithIncompleteChecks,
    isAdmin,
    adminCount,
  ] = await Promise.all([
    tx.loginIdentity.count({ where: { userId } }),
    tx.userRoleAssignment.count({ where: { userId } }),
    tx.teacherAssignment.count({ where: { userId } }),
    tx.privacyConsent.count({ where: { userId } }),
    tx.accessRequest.count({ where: { userId } }),
    tx.auditLog.count({
      where: {
        actorUserId: userId,
        reason: { not: null },
      },
    }),
    activeYearId
      ? tx.teacherAssignment.count({
          where: { userId, academicYearId: activeYearId },
        })
      : Promise.resolve(0),
    tx.lesson.count({
      where: {
        leadTeacherId: userId,
        status: { not: LESSON_STATUS.CHECK_COMPLETED },
      },
    }),
    userHasAdminRole(tx, userId),
    countAdminRoles(tx),
  ]);

  return {
    loginIdentityCount,
    userRoleCount,
    teacherAssignmentCount,
    privacyConsentCount,
    accessRequestCount,
    auditLogUserTextCount,
    assignedToActiveYearGroup: activeYearAssignments > 0,
    lessonsWithIncompleteChecks,
    isSoleAdmin: isAdmin && adminCount <= 1,
  };
}

export async function gatherChildPlanInput(tx: Tx, pupilId: string): Promise<ChildDeletionPlanInput> {
  const [
    enrollmentCount,
    childDataConsentCount,
    homeworkCheckCount,
    homeworkVerseScoreCount,
    homeworkScoreEventCount,
    brickLedgerCount,
    auditLogChildCount,
    achievementAwardCount,
    penaltyCount,
    recitationAttemptCount,
  ] = await Promise.all([
    tx.enrollment.count({ where: { pupilId } }),
    tx.childDataConsent.count({ where: { pupilId } }),
    tx.homeworkCheck.count({ where: { pupilId } }),
    tx.homeworkVerseScore.count({ where: { check: { pupilId } } }),
    tx.homeworkScoreEvent.count({ where: { check: { pupilId } } }),
    tx.brickLedger.count({ where: { pupilId } }),
    tx.auditLog.count({
      where: { entityType: "pupil", entityId: pupilId },
    }),
    tx.achievementAward.count({ where: { pupilId } }),
    tx.penalty.count({ where: { pupilId } }),
    tx.recitationAttempt.count({ where: { pupilId } }),
  ]);

  return {
    enrollmentCount,
    childDataConsentCount,
    homeworkCheckCount,
    homeworkVerseScoreCount,
    homeworkScoreEventCount,
    brickLedgerCount,
    auditLogChildCount,
    achievementAwardCount,
    penaltyCount,
    recitationAttemptCount,
  };
}

export async function previewDeletionPlanInTransaction(
  tx: Tx,
  actorUserId: string,
  input: DeletionRequestIdInput,
): Promise<MutationResult<{ plan: DeletionPlan }>> {
  if (!(await userHasAdminRole(tx, actorUserId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const locked = await lockDeletionRequest(tx, input.requestId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const request = await tx.deletionRequest.findUnique({
    where: { id: locked.id },
    select: { type: true, subjectUserId: true, subjectPupilId: true },
  });
  if (!request) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  if (request.type === DELETION_REQUEST_TYPE.ACCOUNT) {
    const subjectUserId = request.subjectUserId;
    if (!subjectUserId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const user = await tx.appUser.findUnique({
      where: { id: subjectUserId },
      select: { status: true, organizationId: true },
    });
    if (!user || user.status === ACCOUNT_STATUS.DELETED) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const counts = await gatherAccountPlanInput(tx, subjectUserId, user.organizationId);
    const plan = buildDeletionPlan({ type: DELETION_REQUEST_TYPE.ACCOUNT, counts });
    return { ok: true, data: { plan } };
  }

  const subjectPupilId = request.subjectPupilId;
  if (!subjectPupilId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await tx.pupil.findUnique({
    where: { id: subjectPupilId },
    select: { id: true },
  });
  if (!pupil) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const counts = await gatherChildPlanInput(tx, subjectPupilId);
  const plan = buildDeletionPlan({ type: DELETION_REQUEST_TYPE.CHILD_DATA, counts });
  return { ok: true, data: { plan } };
}

/** Read-only plan for admin (deletion_requests §5.3, AZ-07). */
export async function previewDeletionPlan(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ plan: DeletionPlan }>> {
  const parsed = deletionRequestIdInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) => previewDeletionPlanInTransaction(tx, actorUserId, parsed.data));
}
