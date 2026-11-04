import { SAMPLE_LAYER } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import type { GroupAnalyticsPupilRow } from "@/data/analytics/analytics-compute.server";
import { buildBirthYearCohortRows } from "./build-birth-year-cohort-rows";

const emptyAverage = { average: null, observationCount: 0 };

const pupilRow = (
  overrides: Partial<GroupAnalyticsPupilRow> & Pick<GroupAnalyticsPupilRow, "pupilId" | "birthYear">,
): GroupAnalyticsPupilRow => ({
  pupilId: overrides.pupilId,
  displayName: overrides.displayName ?? "Pupil",
  birthYear: overrides.birthYear,
  attendanceRate: overrides.attendanceRate ?? null,
  attendedLessonCount: overrides.attendedLessonCount ?? 0,
  checkedLessonCount: overrides.checkedLessonCount ?? 0,
  versesAverage: overrides.versesAverage ?? emptyAverage,
  testAverage: overrides.testAverage ?? emptyAverage,
  notebookAverage: overrides.notebookAverage ?? emptyAverage,
  enrolledSinceIso: overrides.enrolledSinceIso ?? "2026-01-01",
  layer: overrides.layer ?? SAMPLE_LAYER.A,
});

describe("buildBirthYearCohortRows", () => {
  it("averages attendance rates within a birth year cohort", () => {
    const rows = buildBirthYearCohortRows([
      pupilRow({ pupilId: "a", birthYear: 2015, attendanceRate: 0.8 }),
      pupilRow({ pupilId: "b", birthYear: 2015, attendanceRate: 0.6 }),
      pupilRow({ pupilId: "c", birthYear: 2014, attendanceRate: 1 }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.birthYear).toBe(2014);
    expect(rows[0]?.attendancePercent).toBe(1);
    expect(rows[1]?.birthYear).toBe(2015);
    expect(rows[1]?.attendancePercent).toBeCloseTo(0.7, 5);
  });
});
