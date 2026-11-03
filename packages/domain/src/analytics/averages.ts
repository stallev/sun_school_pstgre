import { LESSON_KIND, type LessonKind } from "../constants/enums";
import type { LessonOrdinalKey } from "../lesson/ordinal";

export type ScoreAverageResult = {
  average: number | null;
  observationCount: number;
};

/** БП-3 / БП-4 — в среднее: присутствие или «сдано позже»; NULL не входит, 0 входит (INV-11). */
export const scoreCountsTowardReportAverage = (
  present: boolean,
  submittedLate: boolean,
  score: number | null,
): boolean => {
  if (score === null) {
    return false;
  }
  return present || submittedLate;
};

export const averageReportScores = (scores: readonly number[]): ScoreAverageResult => {
  if (scores.length === 0) {
    return { average: null, observationCount: 0 };
  }
  const sum = scores.reduce((total, value) => total + value, 0);
  return { average: sum / scores.length, observationCount: scores.length };
};

export const collectReportAverageScores = (
  rows: readonly {
    present: boolean;
    submittedLate: boolean;
    score: number | null;
  }[],
): ScoreAverageResult => {
  const values = rows
    .filter((row) => scoreCountsTowardReportAverage(row.present, row.submittedLate, row.score))
    .map((row) => row.score as number);
  return averageReportScores(values);
};

export type LessonKindKey = LessonOrdinalKey & {
  id: string;
  kind: LessonKind;
};

/** Урок, в запись которого вносят оценки за стихи (БП-2): любой обычный, обзорный не участвует. */
export const isVerseRecitationAnalyticsLesson = (lesson: Pick<LessonKindKey, "kind">): boolean =>
  lesson.kind === LESSON_KIND.REGULAR;

/** «Рассказан» — оценка 1 или 2 (БП-2). */
export const countRecitedVerses = (verseScores: readonly (number | null)[]): number =>
  verseScores.reduce<number>((count, score) => {
    if (score === 1 || score === 2) {
      return count + 1;
    }
    return count;
  }, 0);

export type VerseLessonObservation = {
  lessonId: string;
  present: boolean;
  verseScores: readonly (number | null)[];
};

/** Среднее число рассказанных стихов на уроке по ученикам с валидным наблюдением (БП-2). */
export const averageRecitedVersesForLesson = (
  observations: readonly VerseLessonObservation[],
): ScoreAverageResult => {
  const counts = observations
    .filter((row) => row.present)
    .map((row) => countRecitedVerses(row.verseScores));
  return averageReportScores(counts);
};
