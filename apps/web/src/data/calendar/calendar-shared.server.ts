import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  GRADE_EVENT_TYPE,
  MUTATION_ERROR_CODES,
  type GradeEventType,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { loadGradeInOrganization } from "../school/school-group-shared.server";
import { loadAcademicYearForOrganization } from "../school/school-year-guards.server";
import {
  assertLessonActorForExisting,
  assertLessonActorForGrade,
  isoToLessonDate,
  lessonDateToIso,
  loadLessonInOrganization,
} from "../lessons/lesson-shared.server";

type Tx = Prisma.TransactionClient;

export async function loadGradeEventInOrganization(
  tx: Tx,
  eventId: string,
  organizationId: string,
): Promise<
  | {
      id: string;
      gradeId: string;
      eventDate: Date;
      type: GradeEventType;
      title: string;
      description: string | null;
      lessonId: string | null;
    }
  | MutationErr
> {
  const event = await tx.gradeEvent.findFirst({
    where: { id: eventId, grade: { organizationId } },
    select: {
      id: true,
      gradeId: true,
      eventDate: true,
      type: true,
      title: true,
      description: true,
      lessonId: true,
    },
  });
  if (!event) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return event;
}

export async function assertCalendarMutateAllowed(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  gradeId: string,
  academicYearId: string,
): Promise<{ mode: "admin" | "teacher" } | MutationErr> {
  const actor = await assertLessonActorForGrade(tx, actorUserId, organizationId, gradeId);
  if (isMutationErr(actor)) return actor;

  if (actor.mode === "teacher" && actor.year.status !== ACADEMIC_YEAR_STATUS.ACTIVE) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.year_closed" };
  }

  if (actor.mode === "admin") {
    const year = await loadAcademicYearForOrganization(tx, academicYearId, organizationId);
    if (isMutationErr(year)) return year;
    if (year.status !== ACADEMIC_YEAR_STATUS.ACTIVE) {
      return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.year_closed" };
    }
  }

  return { mode: actor.mode };
}

export async function validateCalendarLessonLink(
  tx: Tx,
  organizationId: string,
  gradeId: string,
  type: GradeEventType,
  lessonId: string | undefined,
): Promise<MutationErr | null> {
  if (type !== GRADE_EVENT_TYPE.LESSON || !lessonId) return null;

  const lesson = await loadLessonInOrganization(tx, lessonId, organizationId);
  if (isMutationErr(lesson)) return lesson;
  if (lesson.gradeId !== gradeId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return null;
}

export async function assertCalendarActorForEvent(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  event: { gradeId: string },
  academicYearId: string,
): Promise<{ mode: "admin" | "teacher" } | MutationErr> {
  const scope = await assertLessonActorForExisting(tx, actorUserId, organizationId, {
    gradeId: event.gradeId,
    academicYearId,
  });
  if (isMutationErr(scope)) return scope;
  return assertCalendarMutateAllowed(tx, actorUserId, organizationId, event.gradeId, academicYearId);
}

export { isoToLessonDate, lessonDateToIso };

export async function assertGradeActiveForCalendar(
  tx: Tx,
  gradeId: string,
  organizationId: string,
): Promise<MutationErr | null> {
  const grade = await loadGradeInOrganization(tx, gradeId, organizationId);
  if (isMutationErr(grade)) return grade;
  if (!grade.isActive) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return null;
}
