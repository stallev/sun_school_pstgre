import "server-only";

import type { AppLocale } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import type { LessonsListRow } from "@/data/lessons/load-lessons-list-page.server";

export type LessonListRowView = LessonsListRow & {
  lessonDateShortLabel: string;
  verseRefsLabel: string | null;
};
import { loadLessonVerseRefLabelsForLessons } from "@/data/lessons/load-lesson-verse-ref-labels.server";
import { formatLessonListShortDate } from "@/lib/lesson/format-lesson-display-date";

export async function buildLessonListRowViews(
  db: PrismaClient,
  lessons: LessonsListRow[],
  gradeId: string,
  locale: AppLocale,
  timeZone: string,
): Promise<LessonListRowView[]> {
  if (lessons.length === 0) {
    return [];
  }

  const grade = await db.grade.findUnique({
    where: { id: gradeId },
    select: { language: true },
  });
  const gradeLanguage = (grade?.language ?? locale) as AppLocale;

  const verseLabels = await loadLessonVerseRefLabelsForLessons(
    db,
    lessons.map((lesson) => ({ lessonId: lesson.lessonId, kind: lesson.kind })),
    gradeLanguage,
    locale,
  );

  return lessons.map((lesson) => ({
    ...lesson,
    lessonDateShortLabel: formatLessonListShortDate(lesson.lessonDateIso, {
      locale,
      timeZone,
    }),
    verseRefsLabel: verseLabels.get(lesson.lessonId) ?? null,
  }));
}
