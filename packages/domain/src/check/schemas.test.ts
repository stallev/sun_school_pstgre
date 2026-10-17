import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import {
  correctCheckInputSchema,
  saveCheckedInputSchema,
  savePartialCheckInputSchema,
} from "./schemas";

const baseIds = {
  lessonId: "00000000-0000-4000-8000-000000000001",
  pupilId: "00000000-0000-4000-8000-000000000002",
};

describe("check input schemas", () => {
  it("accepts score ranges for regular lessons", () => {
    const input = {
      ...baseIds,
      lessonKind: LESSON_KIND.REGULAR,
      present: true,
      testScore: 10,
      notebookScore: 0,
      verseScores: [{ lessonVerseId: "00000000-0000-4000-8000-000000000003", score: 2 }],
      singing: false,
    };
    expect(savePartialCheckInputSchema.safeParse(input).success).toBe(true);
    expect(saveCheckedInputSchema.safeParse(input).success).toBe(true);
    expect(correctCheckInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects review lesson with test or verses", () => {
    const withTest = {
      ...baseIds,
      lessonKind: LESSON_KIND.REVIEW,
      present: true,
      testScore: 5,
      singing: false,
    };
    expect(savePartialCheckInputSchema.safeParse(withTest).success).toBe(false);

    const withVerses = {
      ...baseIds,
      lessonKind: LESSON_KIND.REVIEW,
      present: true,
      verseScores: [
        { lessonVerseId: "00000000-0000-4000-8000-000000000003", score: 1 },
      ],
      singing: false,
    };
    expect(saveCheckedInputSchema.safeParse(withVerses).success).toBe(false);
  });

  it("requires presence on saveChecked", () => {
    const input = {
      ...baseIds,
      lessonKind: LESSON_KIND.REGULAR,
      present: false,
      singing: false,
    };
    expect(saveCheckedInputSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    { field: "testScore", value: 11 },
    { field: "notebookScore", value: -1 },
    { field: "verseScores", value: [{ lessonVerseId: "00000000-0000-4000-8000-000000000003", score: 3 }] },
  ])("rejects out-of-range $field", ({ field, value }) => {
    const input = {
      ...baseIds,
      lessonKind: LESSON_KIND.REGULAR,
      present: true,
      singing: false,
      [field]: value,
    };
    expect(savePartialCheckInputSchema.safeParse(input).success).toBe(false);
  });
});
