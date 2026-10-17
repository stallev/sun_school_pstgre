import "server-only";

import { LESSON_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import {
  loadLessonsListPage,
  type LessonsListRow,
} from "@/data/lessons/load-lessons-list-page.server";

export type TodayPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | {
      kind: "today";
      gradeId: string;
      gradeName: string;
      yearName: string;
      yearClosed: boolean;
      canMutate: boolean;
      lesson: LessonsListRow | null;
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
): Promise<TodayPageData> {
  const list = await loadLessonsListPage(db, actorUserId, null);
  if (list.kind !== "list") {
    return list;
  }

  const lesson = pickFocalLesson(list.lessons, isoTodayUtc());

  return {
    kind: "today",
    gradeId: list.gradeId,
    gradeName: list.gradeName,
    yearName: list.yearName,
    yearClosed: list.yearClosed,
    canMutate: list.canMutate,
    lesson,
  };
}
