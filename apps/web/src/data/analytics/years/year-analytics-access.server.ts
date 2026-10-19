import "server-only";

import {
  ACCOUNT_STATUS,
  ACADEMIC_YEAR_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  filterVisibleYears,
  type AcademicYearRef,
  type MutationErr,
  type UserRole,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { userHasAdminRole } from "../../access/access-admin-guards.server";
import { isoFromCalendarDate } from "../../school/calendar-date";
import { canViewGroupYear, canViewPupilYears } from "@sunschool/policy-server";

type Tx = Prisma.TransactionClient;

export async function loadActorAnalyticsRole(tx: Tx, actorUserId: string): Promise<UserRole> {
  if (await userHasAdminRole(tx, actorUserId)) return USER_ROLE.ADMIN;
  return USER_ROLE.TEACHER;
}

export async function loadGroupYearCatalog(
  tx: Tx,
  organizationId: string,
  gradeId: string,
): Promise<AcademicYearRef[]> {
  const [settingsRows, snapshotRows] = await Promise.all([
    tx.gradeSettings.findMany({
      where: { gradeId, grade: { organizationId } },
      select: { academicYear: { select: { id: true, status: true, startsOn: true } } },
    }),
    tx.analyticsGroupYearSnapshot.findMany({
      where: { gradeId, academicYear: { organizationId } },
      select: { academicYear: { select: { id: true, status: true, startsOn: true } } },
      distinct: ["academicYearId"],
    }),
  ]);

  const byId = new Map<string, AcademicYearRef>();
  for (const row of [...settingsRows, ...snapshotRows]) {
    const year = row.academicYear;
    byId.set(year.id, {
      id: year.id,
      status: year.status,
      startsOn: isoFromCalendarDate(year.startsOn),
    });
  }
  return [...byId.values()];
}

export async function loadTeacherAssignedYearIdsForGrade(
  tx: Tx,
  actorUserId: string,
  gradeId: string,
): Promise<string[]> {
  const rows = await tx.teacherAssignment.findMany({
    where: { userId: actorUserId, gradeId },
    select: { academicYearId: true },
  });
  return rows.map((row) => row.academicYearId);
}

export async function loadVisibleGroupYears(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  gradeId: string,
): Promise<AcademicYearRef[]> {
  const role = await loadActorAnalyticsRole(tx, actorUserId);
  const catalog = await loadGroupYearCatalog(tx, organizationId, gradeId);
  const teacherAssignedYearIds =
    role === USER_ROLE.TEACHER
      ? await loadTeacherAssignedYearIdsForGrade(tx, actorUserId, gradeId)
      : [];
  return filterVisibleYears({ role, allYears: catalog, teacherAssignedYearIds });
}

export async function assertGroupYearViewAccess(
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

  const decision = canViewGroupYear(await loadPolicyFacts(tx, actorUserId), {
    gradeExistsInOrganization: Boolean(grade),
    teacherAssignedToGradeInYear: Boolean(teacherAssigned),
  });

  if (!decision.allowed) {
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
  return null;
}

async function loadPolicyFacts(tx: Tx, actorUserId: string) {
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

export async function teacherCanAccessPupilForAnalytics(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
): Promise<boolean> {
  if (await userHasAdminRole(tx, actorUserId)) return true;

  const enrollments = await tx.enrollment.findMany({
    where: { pupilId, pupil: { organizationId } },
    select: { gradeId: true, academicYearId: true },
  });
  for (const enrollment of enrollments) {
    const assigned = await tx.teacherAssignment.findFirst({
      where: {
        userId: actorUserId,
        gradeId: enrollment.gradeId,
        academicYearId: enrollment.academicYearId,
      },
      select: { id: true },
    });
    if (assigned) return true;
  }
  return false;
}

export async function assertPupilYearsViewAccess(
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

  const decision = canViewPupilYears(await loadPolicyFacts(tx, actorUserId), {
    pupilExistsInOrganization: Boolean(pupil),
    teacherCanAccessPupil: teacherCanAccess,
  });

  if (!decision.allowed) {
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
  return null;
}

export function resolveYearSelection(
  visibleYears: readonly AcademicYearRef[],
  yearParam: string | undefined,
): { kind: "year"; yearId: string } | { kind: "none" } | { kind: "not_found" } {
  if (visibleYears.length === 0) return { kind: "none" };
  if (yearParam) {
    const match = visibleYears.find((year) => year.id === yearParam);
    return match ? { kind: "year", yearId: match.id } : { kind: "not_found" };
  }
  const active = visibleYears.find((year) => year.status === ACADEMIC_YEAR_STATUS.ACTIVE);
  if (active) return { kind: "year", yearId: active.id };
  const closed = [...visibleYears]
    .filter((year) => year.status === ACADEMIC_YEAR_STATUS.CLOSED)
    .sort((left, right) => right.startsOn.localeCompare(left.startsOn));
  if (closed[0]) return { kind: "year", yearId: closed[0].id };
  return { kind: "none" };
}
