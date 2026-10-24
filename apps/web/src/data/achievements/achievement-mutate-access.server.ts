import "server-only";

import {
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  type MutationErr,
  type UserRole,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import {
  canAwardManually,
  canCopyGroupAchievementPoints,
  canRevokeAward,
  canSetGroupAchievementMode,
  canSetGroupAchievementPoints,
} from "@sunschool/policy-server";
import { teacherCanAccessPupilForAnalytics } from "../analytics/years/year-analytics-access.server";

type Tx = Prisma.TransactionClient;

async function loadPolicySessionContext(tx: Tx, actorUserId: string) {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: {
      id: true,
      status: true,
      roles: { select: { role: true } },
    },
  });
  if (!user) {
    return {
      userId: actorUserId,
      status: ACCOUNT_STATUS.DISABLED,
      roles: [] as UserRole[],
    };
  }
  return {
    userId: user.id,
    status: user.status,
    roles: user.roles.map((row) => row.role),
  };
}

function policyToMutation(decision: { allowed: boolean; reason?: string }): MutationErr {
  if (decision.reason === "YEAR_CLOSED") {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_YEAR_CLOSED,
      message: "common.errors.year_closed",
    };
  }
  return {
    ok: false,
    code:
      decision.reason === "FORBIDDEN"
        ? MUTATION_ERROR_CODES.FORBIDDEN
        : MUTATION_ERROR_CODES.NOT_FOUND,
    message:
      decision.reason === "FORBIDDEN"
        ? "common.errors.forbidden"
        : "common.errors.not_found",
  };
}

export async function assertAwardManuallyAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
): Promise<MutationErr | null> {
  const pupil = await tx.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { id: true },
  });
  const teacherCanAccess = await teacherCanAccessPupilForAnalytics(
    tx,
    actorUserId,
    organizationId,
    pupilId,
  );

  const decision = canAwardManually(await loadPolicySessionContext(tx, actorUserId), {
    pupilExistsInOrganization: Boolean(pupil),
    teacherCanAccessPupil: teacherCanAccess,
  });

  if (!decision.allowed) return policyToMutation(decision);
  return null;
}

export async function assertRevokeAwardAccess(
  tx: Tx,
  actorUserId: string,
): Promise<MutationErr | null> {
  const decision = canRevokeAward(await loadPolicySessionContext(tx, actorUserId));
  if (!decision.allowed) return policyToMutation(decision);
  return null;
}

export async function assertSetGroupAchievementModeAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  gradeId: string,
  academicYearId: string,
): Promise<MutationErr | null> {
  const grade = await tx.grade.findFirst({
    where: { id: gradeId, organizationId },
    select: { id: true },
  });
  const teacherAssigned =
    grade &&
    (await tx.teacherAssignment.findFirst({
      where: { userId: actorUserId, gradeId, academicYearId },
      select: { id: true },
    })) !== null;

  const decision = canSetGroupAchievementMode(await loadPolicySessionContext(tx, actorUserId), {
    gradeExistsInOrganization: Boolean(grade),
    teacherAssignedToGradeInYear: Boolean(teacherAssigned),
  });

  if (!decision.allowed) return policyToMutation(decision);
  return null;
}

async function loadTeacherAssigned(
  tx: Tx,
  actorUserId: string,
  gradeId: string,
  academicYearId: string,
): Promise<boolean> {
  const row = await tx.teacherAssignment.findFirst({
    where: { userId: actorUserId, gradeId, academicYearId },
    select: { id: true },
  });
  return row !== null;
}

export async function assertSetGroupAchievementPointsAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  gradeId: string,
  academicYearId: string,
  academicYearStatus: string,
): Promise<MutationErr | null> {
  const grade = await tx.grade.findFirst({
    where: { id: gradeId, organizationId },
    select: { id: true },
  });
  const teacherAssigned = grade
    ? await loadTeacherAssigned(tx, actorUserId, gradeId, academicYearId)
    : false;

  const decision = canSetGroupAchievementPoints(await loadPolicySessionContext(tx, actorUserId), {
    gradeExistsInOrganization: Boolean(grade),
    teacherAssignedToGradeInYear: teacherAssigned,
    academicYearStatus,
  });

  if (!decision.allowed) return policyToMutation(decision);
  return null;
}

export async function assertCopyGroupAchievementPointsAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  targetGradeId: string,
  sourceGradeId: string,
  academicYearId: string,
  academicYearStatus: string,
): Promise<MutationErr | null> {
  const [targetGrade, sourceGrade] = await Promise.all([
    tx.grade.findFirst({
      where: { id: targetGradeId, organizationId },
      select: { id: true },
    }),
    tx.grade.findFirst({
      where: { id: sourceGradeId, organizationId },
      select: { id: true },
    }),
  ]);
  const teacherAssignedTarget = targetGrade
    ? await loadTeacherAssigned(tx, actorUserId, targetGradeId, academicYearId)
    : false;
  const teacherAssignedSource = sourceGrade
    ? await loadTeacherAssigned(tx, actorUserId, sourceGradeId, academicYearId)
    : false;

  const decision = canCopyGroupAchievementPoints(await loadPolicySessionContext(tx, actorUserId), {
    target: {
      gradeExistsInOrganization: Boolean(targetGrade),
      teacherAssignedToGradeInYear: teacherAssignedTarget,
      academicYearStatus,
    },
    sourceGradeExistsInOrganization: Boolean(sourceGrade),
    teacherAssignedToSourceGradeInYear: teacherAssignedSource,
  });

  if (!decision.allowed) return policyToMutation(decision);
  return null;
}
