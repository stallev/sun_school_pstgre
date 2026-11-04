import { describe, expect, it } from "vitest";
import type { GroupAnalyticsPupilRow } from "@/data/analytics/analytics-compute.server";
import { SAMPLE_LAYER } from "@sunschool/domain";
import {
  getPupilRowAttentionFlags,
  isLowAttendanceRate,
  isLowLessonScore,
} from "@/lib/analytics/pupil-row-attention";

const baseRow = (): GroupAnalyticsPupilRow => ({
  pupilId: "p1",
  displayName: "Test",
  birthYear: 2015,
  enrolledSinceIso: "2026-09-01",
  layer: SAMPLE_LAYER.A,
  attendanceRate: 0.6,
  checkedLessonCount: 10,
  attendedLessonCount: 6,
  versesAverage: { average: 1.5, observationCount: 8 },
  testAverage: { average: 5, observationCount: 8 },
  notebookAverage: { average: 5, observationCount: 8 },
});

describe("pupil-row-attention", () => {
  it("flags low attendance below 50%", () => {
    expect(isLowAttendanceRate(0.49)).toBe(true);
    expect(isLowAttendanceRate(0.5)).toBe(false);
    expect(isLowAttendanceRate(null)).toBe(false);
  });

  it("flags low lesson scores below 4", () => {
    const row = baseRow();
    row.testAverage = { average: 3.5, observationCount: 4 };
    expect(isLowLessonScore(row)).toBe(true);
  });

  it("combines attention flags", () => {
    const row = baseRow();
    row.attendanceRate = 0.4;
    row.notebookAverage = { average: 2, observationCount: 3 };
    expect(getPupilRowAttentionFlags(row)).toEqual({
      isLowAttendance: true,
      isLowScore: true,
    });
  });
});
