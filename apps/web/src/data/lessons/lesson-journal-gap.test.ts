import { describe, expect, it } from "vitest";
import { lessonHasJournalGap } from "./lesson-journal-gap";

describe("lessonHasJournalGap (R-24)", () => {
  it("is false when the lesson is not checked", () => {
    expect(lessonHasJournalGap(["p1", "p2"], ["p1"], 0)).toBe(false);
  });

  it("is true when a enrolled pupil has no check row", () => {
    expect(lessonHasJournalGap(["p1", "p2"], ["p1"], 3)).toBe(true);
  });

  it("is false when every enrolled pupil has a check row", () => {
    expect(lessonHasJournalGap(["p1", "p2"], ["p1", "p2"], 2)).toBe(false);
  });
});
