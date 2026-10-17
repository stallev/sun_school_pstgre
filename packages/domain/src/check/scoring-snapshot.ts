import {
  defaultGradeScoreWeights,
  type GradeScoreWeightKey,
} from "../school/grade-settings";

export type ScoringSwitches = {
  useVerses: boolean;
  useTest: boolean;
  useNotebook: boolean;
  useSinging: boolean;
};

export type ScoringMaximums = {
  maxVersesPerLesson: number;
};

/** homework_check_contract §6 — frozen at save time (INV-13). */
export type ScoringSnapshot = {
  weights: Record<GradeScoreWeightKey, number>;
  switches: ScoringSwitches;
  maximums: ScoringMaximums;
};

export type GradeSettingsForSnapshot = ScoringSwitches &
  ScoringMaximums & {
    weights: Record<string, number>;
  };

const pickWeights = (weights: Record<string, number>): Record<GradeScoreWeightKey, number> => {
  const defaults = defaultGradeScoreWeights();
  return {
    verses: weights.verses ?? defaults.verses,
    test: weights.test ?? defaults.test,
    notebook: weights.notebook ?? defaults.notebook,
    singing: weights.singing ?? defaults.singing,
  };
};

export const buildScoringSnapshot = (settings: GradeSettingsForSnapshot): ScoringSnapshot => ({
  weights: pickWeights(settings.weights),
  switches: {
    useVerses: settings.useVerses,
    useTest: settings.useTest,
    useNotebook: settings.useNotebook,
    useSinging: settings.useSinging,
  },
  maximums: {
    maxVersesPerLesson: settings.maxVersesPerLesson,
  },
});
