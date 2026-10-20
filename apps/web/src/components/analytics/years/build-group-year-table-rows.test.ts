import { describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION } from "@sunschool/domain";
import type { GroupYearTotalRow } from "@/data/analytics/years/list-group-year-totals";
import { buildGroupYearTableRows } from "./build-group-year-table-rows";

const reliableTotals = {
  kids: 12,
  lessons: 8,
  attendance: 0.8,
  verses: 1.2,
  test: 7.5,
  notebook: 8.1,
};

const row = (
  yearId: string,
  yearName: string,
  totals: GroupYearTotalRow["totals"],
): GroupYearTotalRow => ({
  yearId,
  yearName,
  status: ACADEMIC_YEAR_STATUS.CLOSED,
  methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
  totals,
  diff: null,
  snapshotMissing: false,
});

describe("buildGroupYearTableRows", () => {
  it("marks the earliest year as having no previous year for comparison", () => {
    const rows = buildGroupYearTableRows([
      row("y2024", "2024–2025", reliableTotals),
      row("y2025", "2025–2026", reliableTotals),
    ]);

    const first = rows.find((item) => item.yearId === "y2024");
    const second = rows.find((item) => item.yearId === "y2025");

    expect(first?.hasPreviousYear).toBe(false);
    expect(first?.comparisonReliable).toBe(false);
    expect(second?.hasPreviousYear).toBe(true);
    expect(second?.comparisonReliable).toBe(true);
  });

  it("does not mark comparison reliable when thresholds are not met", () => {
    const sparse = { ...reliableTotals, kids: 2, lessons: 1 };
    const rows = buildGroupYearTableRows([
      row("y2024", "2024–2025", reliableTotals),
      row("y2025", "2025–2026", sparse),
    ]);

    const second = rows.find((item) => item.yearId === "y2025");
    expect(second?.hasPreviousYear).toBe(true);
    expect(second?.comparisonReliable).toBe(false);
  });
});
