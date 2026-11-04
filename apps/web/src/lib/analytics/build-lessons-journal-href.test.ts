import { describe, expect, it } from "vitest";
import { buildLessonsJournalHref } from "@/lib/analytics/build-lessons-journal-href";

describe("buildLessonsJournalHref (R-24)", () => {
  it("includes journalGap filter", () => {
    expect(buildLessonsJournalHref("grade-1")).toBe("/lessons?gradeId=grade-1&journalGap=1");
  });
});
