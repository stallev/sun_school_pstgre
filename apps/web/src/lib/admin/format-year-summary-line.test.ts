import { describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { formatYearSummaryLine, resolveYearCardSummaryLine } from "@/lib/admin/format-year-summary-line";

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

  it("shows archive copy for closed year without counts", () => {
    const line = resolveYearCardSummaryLine({
      locale: "ru",
      template: "{lessons} · {groups} · {pupils}",
      lessonCount: 0,
      groupCount: 0,
      pupilCount: 0,
      lessonForms: { one: "{count}", few: "{count}", many: "{count}", other: "{count}" },
      groupForms: { one: "{count}", few: "{count}", many: "{count}", other: "{count}" },
      pupilForms: { one: "{count}", few: "{count}", many: "{count}", other: "{count}" },
      status: ACADEMIC_YEAR_STATUS.CLOSED,
      archiveSummary: "Данные года в архиве",
    });
    expect(line).toBe("Данные года в архиве");
  });
});
