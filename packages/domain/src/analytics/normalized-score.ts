import { LESSON_KIND, type LessonKind } from "../constants/enums";
import type { GradeScoreWeightKey } from "../school/grade-settings";
import type { ScoringSwitches } from "../check/scoring-snapshot";

export type LessonScoreWeights = Record<GradeScoreWeightKey, number>;

export type LessonMaximumInput = {
  lessonKind: LessonKind;
  versesToReciteCount: number;
  testConducted: boolean;
  singingPossible: boolean;
  weights: LessonScoreWeights;
  switches: ScoringSwitches;
};

/** Максимум баллов урока для нормирования (спец. 9.1.3). */
export const computeLessonPointsMaximum = (input: LessonMaximumInput): number => {
  const { lessonKind, versesToReciteCount, testConducted, singingPossible, weights, switches } =
    input;

  if (lessonKind === LESSON_KIND.REVIEW) {
    let maximum = 0;
    if (switches.useNotebook) {
      maximum += 10 * weights.notebook;
    }
    if (switches.useSinging && singingPossible) {
      maximum += weights.singing;
    }
    return maximum;
  }

  let maximum = 0;
  if (switches.useVerses && versesToReciteCount > 0) {
    maximum += versesToReciteCount * 2 * weights.verses;
  }
  if (switches.useTest && testConducted) {
    maximum += 10 * weights.test;
  }
  if (switches.useNotebook) {
    maximum += 10 * weights.notebook;
  }
  if (switches.useSinging && singingPossible) {
    maximum += weights.singing;
  }
  return maximum;
};

export const computeNormalizedPercent = (points: number, maximum: number): number | null => {
  if (maximum <= 0) {
    return null;
  }
  return (points / maximum) * 100;
};

export type DynamicsLessonPointInput = {
  isChecked: boolean;
  present: boolean;
  hasLateSubmission: boolean;
  pointsTotal: number | null;
  maximumPoints: number;
};

/**
 * 9.1.3 — пропуск точки, а не ноль: нет записи / отсутствие без «сдано позже».
 * «Сдано позже» входит.
 */
export const shouldIncludeDynamicsPoint = (input: DynamicsLessonPointInput): boolean => {
  if (!input.isChecked || input.pointsTotal === null) {
    return false;
  }
  if (input.maximumPoints <= 0) {
    return false;
  }
  return input.present || input.hasLateSubmission;
};

export const computeDynamicsNormalizedPercent = (
  input: DynamicsLessonPointInput,
): number | null => {
  if (!shouldIncludeDynamicsPoint(input) || input.pointsTotal === null) {
    return null;
  }
  return computeNormalizedPercent(input.pointsTotal, input.maximumPoints);
};
