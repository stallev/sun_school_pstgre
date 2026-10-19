import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import { buildPupilYearTableRows } from "./build-pupil-year-table-rows";
import type { PupilYearRow } from "@/data/analytics/years/list-pupil-year-rows";

const baseRow = (overrides: Partial<PupilYearRow> = {}): PupilYearRow => ({
  yearId: "y1",
  yearName: "2025–2026",
  status: ACADEMIC_YEAR_STATUS.CLOSED,
  gradeLabels: "Средняя → Старшая 1",
  gradeIds: ["g1", "g2"],
  hasForeignGroupForTeacher: false,
  totals: {
    lessons: 8,
    attendance: 0.85,
    verses: 1.7,
    test: 8.1,
    notebook: 7.5,
    bricksEarned: 12,
  },
  bricksIssued: 10,
  methodologyVersion: "v1",
  snapshotMissing: false,
  insufficientLessons: false,
  ...overrides,
});

describe("buildPupilYearTableRows", () => {
  it("maps DAL rows to table rows including active flag and bricks", () => {
    const tableRow = buildPupilYearTableRows([
      baseRow({ status: ACADEMIC_YEAR_STATUS.ACTIVE }),
    ])[0]!;

    expect(tableRow.isActive).toBe(true);
    expect(tableRow.gradeLabels).toBe("Средняя → Старшая 1");
    expect(tableRow.bricksEarned).toBe(12);
    expect(tableRow.bricksIssued).toBe(10);
    expect(tableRow.attendance).toBe(0.85);
  });

  it("uses zero defaults when totals are missing", () => {
    const tableRow = buildPupilYearTableRows([baseRow({ totals: null })])[0]!;

    expect(tableRow.lessons).toBe(0);
    expect(tableRow.bricksEarned).toBe(0);
    expect(tableRow.attendance).toBeNull();
  });
});
