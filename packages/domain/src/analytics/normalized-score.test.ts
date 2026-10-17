import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import { defaultGradeScoreWeights } from "../school/grade-settings";
import {
  computeDynamicsNormalizedPercent,
  computeLessonPointsMaximum,
  computeNormalizedPercent,
  shouldIncludeDynamicsPoint,
} from "./normalized-score";

const weights = defaultGradeScoreWeights();
const switches = {
  useVerses: true,
  useTest: true,
  useNotebook: true,
  useSinging: true,
};

describe("computeLessonPointsMaximum", () => {
  it("uses verse count and test flag on regular lessons", () => {
    const maximum = computeLessonPointsMaximum({
      lessonKind: LESSON_KIND.REGULAR,
      versesToReciteCount: 2,
      testConducted: true,
      singingPossible: true,
      weights,
      switches,
    });
    expect(maximum).toBe(2 * 2 * weights.verses + 10 * weights.test + 10 * weights.notebook + weights.singing);
  });

  it("review lesson — notebook and singing only", () => {
    const maximum = computeLessonPointsMaximum({
      lessonKind: LESSON_KIND.REVIEW,
      versesToReciteCount: 0,
      testConducted: false,
      singingPossible: true,
      weights,
      switches,
    });
    expect(maximum).toBe(10 * weights.notebook + weights.singing);
  });
});

describe("dynamics point inclusion", () => {
  it.each([
    {
      name: "absent without late — skip",
      input: {
        isChecked: true,
        present: false,
        hasLateSubmission: false,
        pointsTotal: 5,
        maximumPoints: 10,
      },
      included: false,
    },
    {
      name: "late submission counts",
      input: {
        isChecked: true,
        present: false,
        hasLateSubmission: true,
        pointsTotal: 5,
        maximumPoints: 10,
      },
      included: true,
      percent: 50,
    },
    {
      name: "present counts",
      input: {
        isChecked: true,
        present: true,
        hasLateSubmission: false,
        pointsTotal: 8,
        maximumPoints: 10,
      },
      included: true,
      percent: 80,
    },
  ])("$name", ({ input, included, percent }) => {
    expect(shouldIncludeDynamicsPoint(input)).toBe(included);
    if (percent !== undefined) {
      expect(computeDynamicsNormalizedPercent(input)).toBe(percent);
    }
  });

  it("normalized percent handles zero maximum", () => {
    expect(computeNormalizedPercent(5, 0)).toBeNull();
  });
});
