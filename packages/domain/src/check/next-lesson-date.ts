import { compareLessonsForOrdinal, type LessonOrdinalKey } from "../lesson/ordinal";

export type LessonForNextDate = LessonOrdinalKey & {
  id: string;
  lessonDate: string;
};

/** homework_check_contract §7 — nearest lesson in the group after the current one (any kind). */
export const nextLessonDate = (
  lessons: readonly LessonForNextDate[],
  currentLessonId: string,
): string | null => {
  const ordered = [...lessons].sort(compareLessonsForOrdinal);
  const currentIndex = ordered.findIndex((lesson) => lesson.id === currentLessonId);
  if (currentIndex < 0 || currentIndex >= ordered.length - 1) {
    return null;
  }
  const nextLesson = ordered[currentIndex + 1];
  return nextLesson?.lessonDate ?? null;
};
