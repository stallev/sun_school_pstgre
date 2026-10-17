import { LESSON_KIND, type LessonKind } from "../constants/enums";
import type { GradeScoreWeightKey } from "../school/grade-settings";
import type { ScoringSwitches } from "./scoring-snapshot";

export type ComputePointsScores = {
  verseScores: readonly (number | null)[];
  testScore: number | null;
  notebookScore: number | null;
  singing: boolean;
};

export type ComputePointsWeights = Record<GradeScoreWeightKey, number>;

/** homework_check_contract §6 — presence does not affect total (INV-12). */
export const computePoints = (
  lessonKind: LessonKind,
  scores: ComputePointsScores,
  weights: ComputePointsWeights,
  switches: ScoringSwitches,
): number => {
  if (lessonKind === LESSON_KIND.REVIEW) {
    let total = 0;
    if (switches.useNotebook) {
      total += (scores.notebookScore ?? 0) * weights.notebook;
    }
    if (switches.useSinging && scores.singing) {
      total += weights.singing;
    }
    return total;
  }

  let total = 0;
  if (switches.useVerses) {
    const verseSum = scores.verseScores.reduce<number>(
      (sum, score) => sum + (score ?? 0),
      0,
    );
    total += verseSum * weights.verses;
  }
  if (switches.useTest) {
    total += (scores.testScore ?? 0) * weights.test;
  }
  if (switches.useNotebook) {
    total += (scores.notebookScore ?? 0) * weights.notebook;
  }
  if (switches.useSinging && scores.singing) {
    total += weights.singing;
  }
  return total;
};
