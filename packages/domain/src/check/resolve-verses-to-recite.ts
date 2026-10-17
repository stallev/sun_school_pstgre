import { previousRegularLesson, type LessonForPreviousRegular } from "../lesson/previous-regular";

export type LessonVerseToRecite = {
  lessonVerseId: string;
  position: number;
};

export type LessonWithVersesForRecite = LessonForPreviousRegular & {
  verses: readonly LessonVerseToRecite[];
};

/** БП-2 — verses assigned on the previous regular lesson are recited on this lesson. */
export const resolveVersesToRecite = (
  lessons: readonly LessonWithVersesForRecite[],
  currentLessonId: string,
): readonly LessonVerseToRecite[] => {
  const previousLesson = previousRegularLesson(lessons, currentLessonId);
  if (!previousLesson) {
    return [];
  }
  const source = lessons.find((lesson) => lesson.id === previousLesson.id);
  return source?.verses ?? [];
};
