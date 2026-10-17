import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";

export const MAX_VERSES_PER_LESSON_MIN = 0;
export const MAX_VERSES_PER_LESSON_MAX = 10;

export const DEFAULT_MAX_VERSES_PER_LESSON = 3;
export const DEFAULT_RECITATION_DAYS_N = 3;

/** Score dimension keys stored in `grade_settings.weights` jsonb (contract §5.2 defaults: weight 1). */
export const GRADE_SCORE_WEIGHT_KEYS = ["verses", "test", "notebook", "singing"] as const;
export type GradeScoreWeightKey = (typeof GRADE_SCORE_WEIGHT_KEYS)[number];

export const defaultGradeScoreWeights = (): Record<GradeScoreWeightKey, number> => ({
  verses: 1,
  test: 1,
  notebook: 1,
  singing: 1,
});

export const isValidMaxVersesPerLesson = (value: number): boolean =>
  Number.isInteger(value) && value >= MAX_VERSES_PER_LESSON_MIN && value <= MAX_VERSES_PER_LESSON_MAX;

export const validateScoreWeights = (weights: Record<string, unknown>): MutationErr | null => {
  for (const [key, raw] of Object.entries(weights)) {
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.VALIDATION,
        message: "admin.group.settings_weights_invalid",
        fields: { [`weights.${key}`]: "admin.group.settings_weights_invalid" },
      };
    }
  }
  return null;
};
