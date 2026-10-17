import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  assignLessonOrdinals,
  type AcademicYearStatus,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { isMutationErr, userHasAdminRole } from "../access/access-admin-guards.server";
import { loadActiveAcademicYearId } from "../access/active-academic-year.server";
import { assertTeacherAssignedToGradeInYear } from "../school/school-enrollment-shared.server";
import { assertUserIsActiveTeacher } from "../school/school-group-shared.server";
import { lockAcademicYearRow, loadAcademicYearForOrganization } from "../school/school-year-guards.server";
import { calendarDateFromIso, isoFromCalendarDate } from "../school/calendar-date";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

export { loadActorOrganizationId };

export async function assertLeadTeacherOnGrade(
  tx: Tx,
  leadTeacherId: string,
  gradeId: string,
  academicYearId: string,
  organizationId: string,
): Promise<MutationErr | null> {
  const teacherError = await assertUserIsActiveTeacher(tx, leadTeacherId, organizationId);
  if (teacherError) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_LEAD_NOT_ASSIGNED,
      message: "teacher.lesson.lead_not_assigned",
    };
  }
  const assignment = await tx.teacherAssignment.findUnique({
    where: {
      userId_gradeId_academicYearId: { userId: leadTeacherId, gradeId, academicYearId },
    },
    select: { id: true },
  });
  if (!assignment) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_LEAD_NOT_ASSIGNED,
      message: "teacher.lesson.lead_not_assigned",
    };
  }
  return null;
}

export async function assertLessonActorForGrade(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  gradeId: string,
): Promise<
  | { mode: "admin" | "teacher"; year: { id: string; status: AcademicYearStatus; startsOn: Date; endsOn: Date } }
  | MutationErr
> {
  const isAdmin = await userHasAdminRole(tx, actorUserId);
  const activeYearId = await loadActiveAcademicYearId(tx, organizationId);

  if (isAdmin) {
    if (!activeYearId) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.CHECK_YEAR_NOT_ACTIVE,
        message: "teacher.lesson.year_not_active",
      };
    }
    const year = await loadAcademicYearForOrganization(tx, activeYearId, organizationId);
    if (isMutationErr(year)) return year;
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

  if (!activeYearId) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.year_closed" };
  }

  const year = await loadAcademicYearForOrganization(tx, activeYearId, organizationId);
  if (isMutationErr(year)) return year;
  if (year.status !== ACADEMIC_YEAR_STATUS.ACTIVE) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.year_closed" };
  }

  const scope = await assertTeacherAssignedToGradeInYear(tx, actorUserId, gradeId, year.id);
  if (scope) return scope;

  return { mode: "teacher", year };
}

export async function assertLessonActorForExisting(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  lesson: { gradeId: string; academicYearId: string },
): Promise<{ mode: "admin" | "teacher" } | MutationErr> {
  const isAdmin = await userHasAdminRole(tx, actorUserId);
  if (isAdmin) return { mode: "admin" };

  const user = await tx.appUser.findFirst({
    where: { id: actorUserId, organizationId },
    select: { roles: { select: { role: true } } },
  });
  const isTeacher = user?.roles.some((row) => row.role === USER_ROLE.TEACHER) ?? false;
  if (!isTeacher) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const year = await loadAcademicYearForOrganization(tx, lesson.academicYearId, organizationId);
  if (isMutationErr(year)) return year;
  if (year.status !== ACADEMIC_YEAR_STATUS.ACTIVE) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.year_closed" };
  }

  const scope = await assertTeacherAssignedToGradeInYear(
    tx,
    actorUserId,
    lesson.gradeId,
    lesson.academicYearId,
  );
  if (scope) return scope;

  return { mode: "teacher" };
}

export const assertLessonDateInActiveYear = (
  lessonDateIso: string,
  year: { status: string; startsOn: Date; endsOn: Date },
): MutationErr | null => {
  if (year.status !== ACADEMIC_YEAR_STATUS.ACTIVE) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_YEAR_NOT_ACTIVE,
      message: "teacher.lesson.year_not_active",
    };
  }
  const starts = isoFromCalendarDate(year.startsOn);
  const ends = isoFromCalendarDate(year.endsOn);
  if (lessonDateIso < starts || lessonDateIso > ends) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_YEAR_NOT_ACTIVE,
      message: "teacher.lesson.year_not_active",
    };
  }
  return null;
};

export async function lockLessonYearAndAssertActive(
  tx: Tx,
  yearId: string,
  organizationId: string,
  lessonDateIso: string,
): Promise<
  | { id: string; status: AcademicYearStatus; startsOn: Date; endsOn: Date }
  | MutationErr
> {
  const locked = await lockAcademicYearRow(tx, yearId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  const year = await loadAcademicYearForOrganization(tx, yearId, organizationId);
  if (isMutationErr(year)) return year;
  const dateError = assertLessonDateInActiveYear(lessonDateIso, year);
  if (dateError) return dateError;
  return year;
}

export async function loadLessonInOrganization(
  tx: Tx,
  lessonId: string,
  organizationId: string,
): Promise<
  | {
      id: string;
      gradeId: string;
      academicYearId: string;
      title: string;
      lessonDate: Date;
      kind: string;
      body: string | null;
      hasTest: boolean;
      leadTeacherId: string;
      createdAt: Date;
    }
  | MutationErr
> {
  const lesson = await tx.lesson.findFirst({
    where: { id: lessonId, grade: { organizationId } },
    select: {
      id: true,
      gradeId: true,
      academicYearId: true,
      title: true,
      lessonDate: true,
      kind: true,
      body: true,
      hasTest: true,
      leadTeacherId: true,
      createdAt: true,
    },
  });
  if (!lesson) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return lesson;
}

export async function lessonHasHomeworkChecks(tx: Tx, lessonId: string): Promise<boolean> {
  const count = await tx.homeworkCheck.count({ where: { lessonId } });
  return count > 0;
}

export async function recalculateLessonOrdinals(
  tx: Tx,
  gradeId: string,
  academicYearId: string,
): Promise<void> {
  const lessons = await tx.lesson.findMany({
    where: { gradeId, academicYearId },
    select: { id: true, lessonDate: true, createdAt: true },
  });
  const withOrdinals = assignLessonOrdinals(
    lessons.map((row) => ({
      id: row.id,
      lessonDate: isoFromCalendarDate(row.lessonDate),
      createdAt: row.createdAt.toISOString(),
    })),
  );
  for (const row of withOrdinals) {
    await tx.lesson.update({
      where: { id: row.id },
      data: { ordinal: row.ordinal },
    });
  }
}

export async function ensureLessonGradeEvent(
  tx: Tx,
  lesson: { id: string; gradeId: string; title: string; lessonDate: Date },
): Promise<void> {
  const existing = await tx.gradeEvent.findFirst({
    where: { lessonId: lesson.id },
    select: { id: true },
  });
  if (existing) return;

  await tx.gradeEvent.create({
    data: {
      gradeId: lesson.gradeId,
      eventDate: lesson.lessonDate,
      type: "LESSON",
      title: lesson.title,
      lessonId: lesson.id,
    },
  });
}

export const lessonDateToIso = (value: Date): string => isoFromCalendarDate(value);

export const isoToLessonDate = (iso: string): Date => calendarDateFromIso(iso);
