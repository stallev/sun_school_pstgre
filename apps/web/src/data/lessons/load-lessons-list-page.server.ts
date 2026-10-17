import "server-only";

import { ACADEMIC_YEAR_STATUS, type LessonKind, type LessonStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { calendarDateFromIso } from "@/data/school/calendar-date";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { lessonDateToIso } from "./lesson-shared.server";

export type LessonsListGradeOption = { gradeId: string; name: string };

export type LessonsListRow = {
  lessonId: string;
  ordinal: number;
  lessonDateIso: string;
  title: string;
  kind: LessonKind;
  leadName: string;
  status: LessonStatus;
  checkedCount: number;
  totalPupils: number;
};

export type LessonsListPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | {
      kind: "list";
      gradeId: string;
      gradeName: string;
      grades: LessonsListGradeOption[];
      yearName: string;
      yearClosed: boolean;
      isAdmin: boolean;
      canMutate: boolean;
      lessons: LessonsListRow[];
    };

async function loadGradeOptions(
  db: PrismaClient,
  actorUserId: string,
  yearId: string,
  organizationId: string,
  isAdmin: boolean,
): Promise<LessonsListGradeOption[]> {
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

async function countPupilsOnLesson(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  lessonDate: Date,
): Promise<number> {
  const date = calendarDateFromIso(lessonDateToIso(lessonDate));
  return db.enrollment.count({
    where: {
      gradeId,
      academicYearId,
      startsOn: { lte: date },
      OR: [{ endsOn: null }, { endsOn: { gte: date } }],
    },
  });
}

export async function loadLessonsListPage(
  db: PrismaClient,
  actorUserId: string,
  preferredGradeId: string | null,
): Promise<LessonsListPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const isAdmin = await userHasAdminRole(db, actorUserId);
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true, status: true },
  });
  if (!year) return { kind: "no_active_year" };

  const grades = await loadGradeOptions(db, actorUserId, year.id, organizationId, isAdmin);
  if (grades.length === 0) return { kind: "unassigned" };

  const gradeId =
    preferredGradeId && grades.some((g) => g.gradeId === preferredGradeId)
      ? preferredGradeId
      : grades[0]?.gradeId;
  if (!gradeId) return { kind: "unassigned" };

  if (!isAdmin) {
    const scope = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (scope) return { kind: "unassigned" };
  }

  const gradeName = grades.find((g) => g.gradeId === gradeId)?.name ?? "";
  const lessonRows = await db.lesson.findMany({
    where: { gradeId, academicYearId: year.id },
    orderBy: [{ lessonDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      ordinal: true,
      lessonDate: true,
      title: true,
      kind: true,
      status: true,
      leadTeacher: {
        select: { lastName: true, firstName: true, middleName: true },
      },
      _count: { select: { checks: { where: { homeworkChecked: true } } } },
    },
  });

  const lessons: LessonsListRow[] = [];
  for (const row of lessonRows) {
    const totalPupils = await countPupilsOnLesson(db, gradeId, year.id, row.lessonDate);
    lessons.push({
      lessonId: row.id,
      ordinal: row.ordinal,
      lessonDateIso: lessonDateToIso(row.lessonDate),
      title: row.title,
      kind: row.kind as LessonKind,
      leadName: formatDisplayName(row.leadTeacher),
      status: row.status as LessonStatus,
      checkedCount: row._count.checks,
      totalPupils,
    });
  }

  const yearClosed = year.status !== ACADEMIC_YEAR_STATUS.ACTIVE;

  return {
    kind: "list",
    gradeId,
    gradeName,
    grades,
    yearName: year.name,
    yearClosed,
    isAdmin,
    canMutate: !yearClosed,
    lessons,
  };
}
