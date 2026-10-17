import "server-only";

import { ACADEMIC_YEAR_STATUS, type GradeEventType } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { lessonDateToIso } from "@/data/lessons/lesson-shared.server";

export type CalendarGradeOption = { gradeId: string; name: string };

export type CalendarEventRow = {
  eventId: string;
  eventDateIso: string;
  dayOfMonth: number;
  type: GradeEventType;
  title: string;
  description: string | null;
  lessonId: string | null;
};

export type CalendarPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | {
      kind: "calendar";
      gradeId: string;
      gradeName: string;
      grades: CalendarGradeOption[];
      yearName: string;
      yearClosed: boolean;
      isAdmin: boolean;
      canMutate: boolean;
      monthKey: string;
      events: CalendarEventRow[];
      lessonsForLink: { lessonId: string; label: string }[];
    };

async function loadGradeOptions(
  db: PrismaClient,
  actorUserId: string,
  yearId: string,
  organizationId: string,
  isAdmin: boolean,
): Promise<CalendarGradeOption[]> {
  if (isAdmin) {
    const rows = await db.grade.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({ gradeId: row.id, name: row.name }));
  }
  const assignments = await db.teacherAssignment.findMany({
    where: { userId: actorUserId, academicYearId: yearId },
    select: { grade: { select: { id: true, name: true } } },
    orderBy: { grade: { name: "asc" } },
  });
  return assignments.map((row) => ({ gradeId: row.grade.id, name: row.grade.name }));
}

const monthBounds = (monthKey: string): { start: Date; end: Date } => {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start, end };
};

export async function loadCalendarPage(
  db: PrismaClient,
  actorUserId: string,
  preferredGradeId: string | null,
  monthKey: string | null,
): Promise<CalendarPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const isAdmin = await userHasAdminRole(db, actorUserId);
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true, status: true, startsOn: true, endsOn: true },
  });
  if (!year) return { kind: "no_active_year" };

  const grades = await loadGradeOptions(db, actorUserId, year.id, organizationId, isAdmin);
  const defaultGrade = grades[0];
  if (!defaultGrade) return { kind: "unassigned" };

  const gradeId =
    preferredGradeId && grades.some((g) => g.gradeId === preferredGradeId)
      ? preferredGradeId
      : defaultGrade.gradeId;
  const gradeName = grades.find((g) => g.gradeId === gradeId)?.name ?? "";

  if (!isAdmin) {
    const scope = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (scope) return { kind: "unassigned" };
  }

  const yearClosed = year.status !== ACADEMIC_YEAR_STATUS.ACTIVE;
  const canMutate = !yearClosed;
  const resolvedMonth =
    monthKey && /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : new Date().toISOString().slice(0, 7);
  const { start, end } = monthBounds(resolvedMonth);

  const rows = await db.gradeEvent.findMany({
    where: {
      gradeId,
      eventDate: { gte: start, lte: end },
    },
    orderBy: [{ eventDate: "asc" }, { title: "asc" }],
    select: {
      id: true,
      eventDate: true,
      type: true,
      title: true,
      description: true,
      lessonId: true,
    },
  });

  const events: CalendarEventRow[] = rows.map((row) => {
    const iso = lessonDateToIso(row.eventDate);
    return {
      eventId: row.id,
      eventDateIso: iso,
      dayOfMonth: Number(iso.slice(8, 10)),
      type: row.type,
      title: row.title,
      description: row.description,
      lessonId: row.lessonId,
    };
  });

  const lessons = await db.lesson.findMany({
    where: { gradeId, academicYearId: year.id },
    orderBy: [{ lessonDate: "asc" }, { ordinal: "asc" }],
    select: { id: true, title: true, ordinal: true, lessonDate: true },
  });
  const lessonsForLink = lessons.map((lesson) => ({
    lessonId: lesson.id,
    label: `#${lesson.ordinal} · ${lesson.title} (${lessonDateToIso(lesson.lessonDate)})`,
  }));

  return {
    kind: "calendar",
    gradeId,
    gradeName,
    grades,
    yearName: year.name,
    yearClosed,
    isAdmin,
    canMutate,
    monthKey: resolvedMonth,
    events,
    lessonsForLink,
  };
}
