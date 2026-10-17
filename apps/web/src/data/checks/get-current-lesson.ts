import "server-only";

import { ACADEMIC_YEAR_STATUS, getCalendarDateInTimeZone } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { getSchoolTimezoneUncached } from "@/lib/i18n/get-school-timezone.server";
import { lessonDateToIso } from "@/data/lessons/lesson-shared.server";
import { pickCurrentHeldLessonId } from "./check-read-shared.server";

export type CurrentLessonData =
  | { kind: "not_found" }
  | { kind: "no_lesson" }
  | { kind: "lesson"; lessonId: string };

export async function getCurrentLesson(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
): Promise<CurrentLessonData> {
  const organizationId = await getDefaultOrganizationId(db);
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true },
  });
  if (!year) return { kind: "not_found" };

  const isAdmin = await userHasAdminRole(db, actorUserId);
  if (!isAdmin) {
    const scope = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (scope) return { kind: "not_found" };
  } else {
    const grade = await db.grade.findFirst({
      where: { id: gradeId, organizationId },
      select: { id: true },
    });
    if (!grade) return { kind: "not_found" };
  }

  const lessons = await db.lesson.findMany({
    where: { gradeId, academicYearId: year.id },
    select: { id: true, lessonDate: true, status: true },
  });
  const schoolTz = await getSchoolTimezoneUncached();
  const todayIso = getCalendarDateInTimeZone(new Date(), schoolTz);
  const lessonId = pickCurrentHeldLessonId(
    lessons.map((row) => ({
      id: row.id,
      lessonDateIso: lessonDateToIso(row.lessonDate),
      status: row.status,
    })),
    todayIso,
  );

  if (!lessonId) return { kind: "no_lesson" };
  return { kind: "lesson", lessonId };
}
