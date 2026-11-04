import "server-only";

import { ACADEMIC_YEAR_STATUS, type LessonKind, type LessonStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { calendarDateFromIso } from "@/data/school/calendar-date";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { lessonHasJournalGap } from "./lesson-journal-gap";
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

const enrollmentOnLessonDateWhere = (
  gradeId: string,
  academicYearId: string,
  lessonDate: Date,
) => {
  const date = calendarDateFromIso(lessonDateToIso(lessonDate));
  return {
    gradeId,
    academicYearId,
    startsOn: { lte: date },
    OR: [{ endsOn: null }, { endsOn: { gte: date } }],
  };
};

async function countPupilsOnLesson(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  lessonDate: Date,
): Promise<number> {
  return db.enrollment.count({
    where: enrollmentOnLessonDateWhere(gradeId, academicYearId, lessonDate),
  });
}

async function loadPupilIdsOnLesson(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  lessonDate: Date,
): Promise<string[]> {
  const rows = await db.enrollment.findMany({
    where: enrollmentOnLessonDateWhere(gradeId, academicYearId, lessonDate),
    select: { pupilId: true },
  });
  return rows.map((row) => row.pupilId);
}

export type LoadLessonsListPageOptions = {
  journalGapOnly?: boolean;
};

export async function loadLessonsListPage(
  db: PrismaClient,
  actorUserId: string,
  preferredGradeId: string | null,
  options: LoadLessonsListPageOptions = {},
): Promise<LessonsListPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const [isAdmin, year] = await Promise.all([
    userHasAdminRole(db, actorUserId),
    db.academicYear.findFirst({
      where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      select: { id: true, name: true, status: true },
    }),
  ]);
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

  const lessons: LessonsListRow[] = await Promise.all(
    lessonRows.map(async (row) => {
      const totalPupils = await countPupilsOnLesson(db, gradeId, year.id, row.lessonDate);
      return {
        lessonId: row.id,
        ordinal: row.ordinal,
        lessonDateIso: lessonDateToIso(row.lessonDate),
        title: row.title,
        kind: row.kind as LessonKind,
        leadName: formatDisplayName(row.leadTeacher),
        status: row.status as LessonStatus,
        checkedCount: row._count.checks,
        totalPupils,
      };
    }),
  );

  let filteredLessons = lessons;
  if (options.journalGapOnly) {
    const checkedLessonIds = lessons.filter((row) => row.checkedCount > 0).map((row) => row.lessonId);
    const checkRows =
      checkedLessonIds.length > 0
        ? await db.homeworkCheck.findMany({
            where: { lessonId: { in: checkedLessonIds } },
            select: { lessonId: true, pupilId: true },
          })
        : [];
    const checkPupilsByLesson = new Map<string, string[]>();
    for (const check of checkRows) {
      const existing = checkPupilsByLesson.get(check.lessonId) ?? [];
      existing.push(check.pupilId);
      checkPupilsByLesson.set(check.lessonId, existing);
    }

    const gapLessonIds = new Set<string>();
    await Promise.all(
      lessons
        .filter((row) => row.checkedCount > 0)
        .map(async (row) => {
          const lessonRow = lessonRows.find((candidate) => candidate.id === row.lessonId);
          if (!lessonRow) return;
          const enrolledPupilIds = await loadPupilIdsOnLesson(db, gradeId, year.id, lessonRow.lessonDate);
          const checkPupilIds = checkPupilsByLesson.get(row.lessonId) ?? [];
          if (lessonHasJournalGap(enrolledPupilIds, checkPupilIds, row.checkedCount)) {
            gapLessonIds.add(row.lessonId);
          }
        }),
    );
    filteredLessons = lessons.filter((row) => gapLessonIds.has(row.lessonId));
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
    lessons: filteredLessons,
  };
}
