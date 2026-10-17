import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  type AcademicYearStatus,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { isMutationErr, userHasAdminRole } from "../access/access-admin-guards.server";
import {
  assertYearNotClosed,
  loadAcademicYearInOrganization,
  resolveAcademicYearForNewGroupSettings,
} from "./school-group-shared.server";
import { calendarDateFromIso, isoFromCalendarDate } from "./calendar-date";

type Tx = Prisma.TransactionClient;

export type ActiveEnrollmentRow = {
  id: string;
  gradeId: string;
  academicYearId: string;
  startsOn: Date;
};

export async function loadActiveEnrollment(
  tx: Tx,
  pupilId: string,
): Promise<ActiveEnrollmentRow | null> {
  return tx.enrollment.findFirst({
    where: { pupilId, endsOn: null },
    select: { id: true, gradeId: true, academicYearId: true, startsOn: true },
  });
}

export async function resolveEnrollmentAcademicYear(
  tx: Tx,
  organizationId: string,
  teacherActiveYearOnly: boolean,
): Promise<{ id: string; status: AcademicYearStatus } | MutationErr> {
  if (teacherActiveYearOnly) {
    const active = await tx.academicYear.findFirst({
      where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      select: { id: true, status: true },
    });
    if (!active) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.FORBIDDEN,
        message: "common.errors.year_closed",
      };
    }
    return { id: active.id, status: active.status as AcademicYearStatus };
  }

  const year = await resolveAcademicYearForNewGroupSettings(tx, organizationId);
  if (!year) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  const loaded = await loadAcademicYearInOrganization(tx, year.id, organizationId);
  if (isMutationErr(loaded)) return loaded;
  return { id: loaded.id, status: loaded.status as AcademicYearStatus };
}

export async function assertTeacherAssignedToGradeInYear(
  tx: Tx,
  actorUserId: string,
  gradeId: string,
  academicYearId: string,
): Promise<MutationErr | null> {
  const assignment = await tx.teacherAssignment.findUnique({
    where: {
      userId_gradeId_academicYearId: {
        userId: actorUserId,
        gradeId,
        academicYearId,
      },
    },
    select: { id: true },
  });
  if (!assignment) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return null;
}

export async function assertAdminActor(tx: Tx, actorUserId: string): Promise<MutationErr | null> {
  if (!(await userHasAdminRole(tx, actorUserId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }
  return null;
}

export async function assertEnrollmentActorForGrade(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  gradeId: string,
): Promise<
  | { mode: "admin" | "teacher"; year: { id: string; status: AcademicYearStatus } }
  | MutationErr
> {
  const isAdmin = await userHasAdminRole(tx, actorUserId);

  if (isAdmin) {
    const year = await resolveEnrollmentAcademicYear(tx, organizationId, false);
    if (isMutationErr(year)) return year;
    const yearClosed = assertYearNotClosed(year.status);
    if (yearClosed) return yearClosed;
    return { mode: "admin", year };
  }

  const user = await tx.appUser.findFirst({
    where: { id: actorUserId, organizationId },
    select: { roles: { select: { role: true } } },
  });
  const isTeacher = user?.roles.some((row) => row.role === USER_ROLE.TEACHER) ?? false;
  if (!isTeacher) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const year = await resolveEnrollmentAcademicYear(tx, organizationId, true);
  if (isMutationErr(year)) return year;
  const scope = await assertTeacherAssignedToGradeInYear(tx, actorUserId, gradeId, year.id);
  if (scope) return scope;
  return { mode: "teacher", year };
}

export const isoFromEnrollmentStartsOn = (startsOn: Date): string => isoFromCalendarDate(startsOn);

export async function closeActiveEnrollment(
  tx: Tx,
  enrollmentId: string,
  endsOnIso: string,
): Promise<MutationErr | null> {
  const result = await tx.enrollment.updateMany({
    where: { id: enrollmentId, endsOn: null },
    data: { endsOn: calendarDateFromIso(endsOnIso) },
  });
  if (result.count === 0) {
    return { ok: false, code: MUTATION_ERROR_CODES.CONFLICT, message: "common.errors.conflict" };
  }
  return null;
}
