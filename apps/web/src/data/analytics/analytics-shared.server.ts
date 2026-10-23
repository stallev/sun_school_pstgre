import "server-only";

import { MUTATION_ERROR_CODES, type MutationErr } from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { isMutationErr, userHasAdminRole, userHasParentRole } from "../access/access-admin-guards.server";
import { assertParentCanViewChildData } from "../families/parent-child-access.server";
import { loadActorOrganizationId } from "../lessons/lesson-shared.server";
import {
  assertAdminActor,
  assertTeacherAssignedToGradeInYear,
} from "../school/school-enrollment-shared.server";
import { loadAcademicYearForOrganization } from "../school/school-year-guards.server";
import { loadPupilInOrganization } from "../school/school-pupil-shared.server";
import {
  type AnalyticsPeriodFilter,
  resolveAnalyticsPeriodBounds,
  type ResolvedAnalyticsPeriod,
} from "./analytics-period";
import { calendarDateFromIso } from "../school/calendar-date";

type Tx = Prisma.TransactionClient;

export async function loadActorOrganizationIdForAnalytics(
  tx: Tx,
  actorUserId: string,
): Promise<string | MutationErr> {
  const organizationId = await loadActorOrganizationId(tx, actorUserId);
  if (!organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return organizationId;
}

export async function assertAnalyticsGradeAccess(
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
  if (!grade) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const year = await loadAcademicYearForOrganization(tx, academicYearId, organizationId);
  if (isMutationErr(year)) return year;

  if (await userHasAdminRole(tx, actorUserId)) {
    return null;
  }

  return assertTeacherAssignedToGradeInYear(tx, actorUserId, gradeId, academicYearId);
}

export async function assertAnalyticsPupilAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
  academicYearId: string,
): Promise<MutationErr | { gradeIds: string[] }> {
  const pupil = await loadPupilInOrganization(tx, pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  const year = await loadAcademicYearForOrganization(tx, academicYearId, organizationId);
  if (isMutationErr(year)) return year;

  const enrollments = await tx.enrollment.findMany({
    where: { pupilId, academicYearId },
    select: { gradeId: true },
  });
  if (enrollments.length === 0) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const gradeIds = enrollments.map((row) => row.gradeId);

  if (await userHasAdminRole(tx, actorUserId)) {
    return { gradeIds };
  }

  if (await userHasParentRole(tx, actorUserId)) {
    const parentAccess = await assertParentCanViewChildData(tx, actorUserId, pupilId);
    if (isMutationErr(parentAccess)) return parentAccess;
    return { gradeIds };
  }

  for (const gradeId of gradeIds) {
    const scope = await assertTeacherAssignedToGradeInYear(
      tx,
      actorUserId,
      gradeId,
      academicYearId,
    );
    if (!scope) {
      return { gradeIds };
    }
  }

  return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
}

export async function assertAnalyticsSchoolAccess(
  tx: Tx,
  actorUserId: string,
): Promise<MutationErr | null> {
  return assertAdminActor(tx, actorUserId);
}

export async function resolveAnalyticsPeriodForOrganization(
  tx: Tx,
  organizationId: string,
  filter: AnalyticsPeriodFilter,
): Promise<ResolvedAnalyticsPeriod | MutationErr> {
  const year = await loadAcademicYearForOrganization(tx, filter.academicYearId, organizationId);
  if (isMutationErr(year)) return year;
  return resolveAnalyticsPeriodBounds(filter, year.startsOn, year.endsOn);
}

export const periodDateRange = (period: ResolvedAnalyticsPeriod): { gte: Date; lte: Date } => ({
  gte: calendarDateFromIso(period.fromIso),
  lte: calendarDateFromIso(period.toIso),
});
