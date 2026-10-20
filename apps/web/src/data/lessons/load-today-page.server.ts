import "server-only";

import { ACADEMIC_YEAR_STATUS, LESSON_STATUS, type AppLocale } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";
import {
  loadLessonsListPage,
  type LessonsListRow,
} from "@/data/lessons/load-lessons-list-page.server";
import { loadLessonVerseRefLabels } from "./load-lesson-verse-ref-labels.server";
import { buildTodayWeekRows, type TodayWeekRow } from "./load-today-week-rows.server";

export type TodayFocalLesson = LessonsListRow & {
  lessonDateLabel: string;
  verseRefsLabel: string | null;
};

export type TodayPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | {
      kind: "today";
      gradeId: string;
      gradeName: string;
      yearName: string;
      yearId: string;
      yearClosed: boolean;
      canMutate: boolean;
      teacherFirstName: string;
      lesson: TodayFocalLesson | null;
      weekRows: TodayWeekRow[];
    };

const isHomeworkCheckIncomplete = (row: LessonsListRow): boolean => {
  if (row.status === LESSON_STATUS.CHECK_COMPLETED) {
    return false;
  }
  if (row.totalPupils > 0 && row.checkedCount >= row.totalPupils) {
    return false;
  }
  return true;
};

const pickFocalLesson = (lessons: LessonsListRow[], todayIso: string): LessonsListRow | null => {
  if (lessons.length === 0) {
    return null;
  }
  const incomplete = lessons.filter(isHomeworkCheckIncomplete);
  const pool = incomplete.length > 0 ? incomplete : lessons;

  const todayLesson = pool.find((row) => row.lessonDateIso === todayIso);
  if (todayLesson) {
    return todayLesson;
  }

  const future = pool
    .filter((row) => row.lessonDateIso > todayIso)
    .sort((a, b) => a.lessonDateIso.localeCompare(b.lessonDateIso));
  if (future.length > 0) {
    return future[0] ?? null;
  }

  const past = pool
    .filter((row) => row.lessonDateIso < todayIso)
    .sort((a, b) => b.lessonDateIso.localeCompare(a.lessonDateIso));
  if (past.length > 0) {
    return past[0] ?? null;
  }

  return pool[0] ?? null;
};

export async function loadTodayPage(
  db: PrismaClient,
  actorUserId: string,
  locale: AppLocale,
  timeZone: string,
  messages: TeacherLessonScreensMessages,
): Promise<TodayPageData> {
  const list = await loadLessonsListPage(db, actorUserId, null);
  if (list.kind !== "list") {
    return list;
  }

  const todayIso = isoTodayUtc();
  const focal = pickFocalLesson(list.lessons, todayIso);

  const organizationId = await getDefaultOrganizationId(db);
  const activeYear = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true },
  });
  const yearId = activeYear?.id ?? "";

  const [teacher, grade] = await Promise.all([
    db.appUser.findUnique({
      where: { id: actorUserId },
      select: { firstName: true },
    }),
    db.grade.findUnique({
      where: { id: list.gradeId },
      select: { language: true },
    }),
  ]);

  let focalLesson: TodayFocalLesson | null = null;
  if (focal && grade) {
    const verseRefsLabel = await loadLessonVerseRefLabels(
      db,
      focal.lessonId,
      grade.language as AppLocale,
      locale,
    );
    focalLesson = {
      ...focal,
      lessonDateLabel: formatLessonDisplayDate(focal.lessonDateIso, {
        locale,
        timeZone,
      }),
      verseRefsLabel,
    };
  } else if (focal) {
    focalLesson = {
      ...focal,
      lessonDateLabel: formatLessonDisplayDate(focal.lessonDateIso, {
        locale,
        timeZone,
      }),
      verseRefsLabel: null,
    };
  }

  const weekRows =
    yearId.length > 0
      ? await buildTodayWeekRows({
          db,
          gradeId: list.gradeId,
          yearId,
          lessons: list.lessons,
          todayIso,
          timeZone,
          messages,
        })
      : [];

  return {
    kind: "today",
    gradeId: list.gradeId,
    gradeName: list.gradeName,
    yearName: list.yearName,
    yearId,
    yearClosed: list.yearClosed,
    canMutate: list.canMutate,
    teacherFirstName: teacher?.firstName?.trim() || "",
    lesson: focalLesson,
    weekRows,
  };
}
