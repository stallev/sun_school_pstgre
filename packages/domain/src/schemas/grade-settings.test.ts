import { describe, expect, it } from "vitest";
import { updateGradeSettingsInputSchema } from "./grade-settings";

describe("updateGradeSettingsInputSchema", () => {
  const valid = {
    gradeId: "00000000-0000-4000-8000-000000000001",
    yearId: "00000000-0000-4000-8000-000000000002",
    useVerses: true,
    useTest: true,
    useNotebook: true,
    useSinging: true,
    maxVersesPerLesson: 3,
    labels: {},
    weights: { verses: 1, test: 0 },
    recitationDaysN: 3,
  };

  it("parses valid settings", () => {
    expect(updateGradeSettingsInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects maxVersesPerLesson above 10", () => {
    expect(updateGradeSettingsInputSchema.safeParse({ ...valid, maxVersesPerLesson: 11 }).success).toBe(
      false,
    );
  });

  it("rejects negative weights", () => {
    expect(
      updateGradeSettingsInputSchema.safeParse({ ...valid, weights: { verses: -1 } }).success,
    ).toBe(false);
  });
});
