import { LESSON_KIND, type LessonKind } from "../constants/enums";

export type LessonVerseToRecite = {
  lessonVerseId: string;
  position: number;
};

export type LessonWithVersesForRecite = {
  kind: LessonKind;
  verses: readonly LessonVerseToRecite[];
};

/**
 * БП-2 — verse scores are entered on the check of the lesson where the verses were assigned
 * (recited on the next regular lesson, scored in this lesson's record). A review lesson has none.
 */
export const resolveVersesToRecite = (
  lesson: LessonWithVersesForRecite,
): readonly LessonVerseToRecite[] => (lesson.kind === LESSON_KIND.REGULAR ? lesson.verses : []);
