import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import {
  isValidMaxVersesPerLesson,
  MAX_VERSES_PER_LESSON_MAX,
  MAX_VERSES_PER_LESSON_MIN,
  validateScoreWeights,
} from "./grade-settings";

describe("isValidMaxVersesPerLesson", () => {
  it("accepts integers 0–10", () => {
    expect(isValidMaxVersesPerLesson(0)).toBe(true);
    expect(isValidMaxVersesPerLesson(10)).toBe(true);
    expect(isValidMaxVersesPerLesson(3)).toBe(true);
  });

  it("rejects out of range and non-integers", () => {
    expect(isValidMaxVersesPerLesson(MAX_VERSES_PER_LESSON_MIN - 1)).toBe(false);
    expect(isValidMaxVersesPerLesson(MAX_VERSES_PER_LESSON_MAX + 1)).toBe(false);
    expect(isValidMaxVersesPerLesson(1.5)).toBe(false);
  });
});

describe("validateScoreWeights", () => {
  it("accepts non-negative integers", () => {
    expect(validateScoreWeights({ verses: 0, test: 2 })).toBeNull();
  });

  it("rejects negative or fractional weights", () => {
    expect(validateScoreWeights({ verses: -1 })?.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
    expect(validateScoreWeights({ test: 1.2 })?.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
  });
});
