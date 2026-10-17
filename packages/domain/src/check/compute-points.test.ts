import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import { defaultGradeScoreWeights } from "../school/grade-settings";
import { computePoints } from "./compute-points";

const weights = defaultGradeScoreWeights();
const allOn = {
  useVerses: true,
  useTest: true,
  useNotebook: true,
  useSinging: true,
};

describe("computePoints", () => {
  it.each([
    {
      name: "full regular sum",
      kind: LESSON_KIND.REGULAR,
      scores: {
        verseScores: [2, 1, null],
        testScore: 8,
        notebookScore: 7,
        singing: true,
      },
      switches: allOn,
      expected: (2 + 1 + 0) * 1 + 8 + 7 + 1,
    },
    {
      name: "NULL scores contribute 0",
      kind: LESSON_KIND.REGULAR,
      scores: {
        verseScores: [null],
        testScore: null,
        notebookScore: null,
        singing: false,
      },
      switches: allOn,
      expected: 0,
    },
    {
      name: "disabled dimensions excluded",
      kind: LESSON_KIND.REGULAR,
      scores: {
        verseScores: [2],
        testScore: 10,
        notebookScore: 10,
        singing: true,
      },
      switches: {
        useVerses: false,
        useTest: true,
        useNotebook: false,
        useSinging: false,
      },
      expected: 10,
    },
    {
      name: "review — notebook and singing only",
      kind: LESSON_KIND.REVIEW,
      scores: {
        verseScores: [2],
        testScore: 10,
        notebookScore: 5,
        singing: true,
      },
      switches: allOn,
      expected: 5 + 1,
    },
    {
      name: "presence does not change total (INV-12)",
      kind: LESSON_KIND.REGULAR,
      scores: {
        verseScores: [],
        testScore: 4,
        notebookScore: 3,
        singing: false,
      },
      switches: allOn,
      expected: 7,
    },
  ])("$name", ({ kind, scores, switches, expected }) => {
    expect(computePoints(kind, scores, weights, switches)).toBe(expected);
  });
});
