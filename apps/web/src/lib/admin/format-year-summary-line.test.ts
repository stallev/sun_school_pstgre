import { describe, expect, it } from "vitest";
import { formatYearSummaryLine } from "@/lib/admin/format-year-summary-line";

describe("formatYearSummaryLine", () => {
  it("formats summary with plural segments", () => {
    const line = formatYearSummaryLine({
      locale: "ru",
      template: "{lessons} · {groups} · {pupils}",
      lessonCount: 5,
      groupCount: 3,
      pupilCount: 100,
      lessonForms: {
        one: "{count} урок",
        few: "{count} урока",
        many: "{count} уроков",
        other: "{count} уроков",
      },
      groupForms: {
        one: "{count} группа",
        few: "{count} группы",
        many: "{count} групп",
        other: "{count} групп",
      },
      pupilForms: {
        one: "{count} ученик",
        few: "{count} ученика",
        many: "{count} учеников",
        other: "{count} учеников",
      },
    });
    expect(line).toBe("5 уроков · 3 группы · 100 учеников");
  });
});
