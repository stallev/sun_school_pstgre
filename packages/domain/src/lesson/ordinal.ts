export type LessonOrdinalKey = {
  lessonDate: string;
  createdAt: string;
};

const toTime = (value: string): number => Date.parse(value);

/** homework_check_contract Q-02 — order by `(lesson_date, created_at)`. */
export const compareLessonsForOrdinal = (
  left: LessonOrdinalKey,
  right: LessonOrdinalKey,
): number => {
  if (left.lessonDate !== right.lessonDate) {
    return left.lessonDate < right.lessonDate ? -1 : 1;
  }
  const leftTime = toTime(left.createdAt);
  const rightTime = toTime(right.createdAt);
  if (leftTime !== rightTime) {
    return leftTime < rightTime ? -1 : 1;
  }
  return 0;
};

export type LessonWithOrdinal<T extends LessonOrdinalKey> = T & { ordinal: number };

/** Assigns contiguous ordinals 1..n for lessons in the same grade and year. */
export const assignLessonOrdinals = <T extends LessonOrdinalKey>(
  lessons: readonly T[],
): LessonWithOrdinal<T>[] => {
  const sorted = [...lessons].sort(compareLessonsForOrdinal);
  return sorted.map((lesson, index) => ({ ...lesson, ordinal: index + 1 }));
};
