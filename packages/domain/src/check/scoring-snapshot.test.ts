import { describe, expect, it } from "vitest";
import { buildScoringSnapshot } from "./scoring-snapshot";

describe("buildScoringSnapshot", () => {
  it("captures weights, switches and maximums", () => {
    const snapshot = buildScoringSnapshot({
      useVerses: true,
      useTest: false,
      useNotebook: true,
      useSinging: true,
      maxVersesPerLesson: 3,
      weights: { verses: 2, test: 1, notebook: 1, singing: 1 },
    });

    expect(snapshot).toEqual({
      weights: { verses: 2, test: 1, notebook: 1, singing: 1 },
      switches: {
        useVerses: true,
        useTest: false,
        useNotebook: true,
        useSinging: true,
      },
      maximums: { maxVersesPerLesson: 3 },
    });
  });
});
