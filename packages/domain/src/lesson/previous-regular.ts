import { LESSON_KIND, type LessonKind } from "../constants/enums";
import { compareLessonsForOrdinal, type LessonOrdinalKey } from "./ordinal";

export type LessonForPreviousRegular = LessonOrdinalKey & {
  id: string;
  kind: LessonKind;
};

/**
 * Previous regular lesson before `currentLessonId` (БП-2) — skips `REVIEW` lessons.
 */
export const previousRegularLesson = (
  lessons: readonly LessonForPreviousRegular[],
  currentLessonId: string,
): LessonForPreviousRegular | null => {
  const ordered = [...lessons].sort(compareLessonsForOrdinal);
  const currentIndex = ordered.findIndex((lesson) => lesson.id === currentLessonId);
  if (currentIndex <= 0) {
    return null;
  }

  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const lesson = ordered[index];
    if (!lesson) continue;
    if (lesson.kind === LESSON_KIND.REGULAR) {
      return lesson;
    }
  }

  return null;
};
