import type { GroupAnalyticsPupilRow } from "@/data/analytics/analytics-compute.server";

const LOW_ATTENDANCE_THRESHOLD = 0.5;
const LOW_SCORE_THRESHOLD = 4;

export const isLowAttendanceRate = (attendanceRate: number | null): boolean =>
  attendanceRate !== null && attendanceRate < LOW_ATTENDANCE_THRESHOLD;

const scoreAverage = (
  average: number | null,
  observationCount: number,
): number | null => (average === null || observationCount === 0 ? null : average);

export const isLowLessonScore = (row: GroupAnalyticsPupilRow): boolean => {
  const candidates = [
    scoreAverage(row.testAverage.average, row.testAverage.observationCount),
    scoreAverage(row.notebookAverage.average, row.notebookAverage.observationCount),
  ].filter((value): value is number => value !== null);
  return candidates.some((value) => value < LOW_SCORE_THRESHOLD);
};

export const getPupilRowAttentionFlags = (row: GroupAnalyticsPupilRow) => ({
  isLowAttendance: isLowAttendanceRate(row.attendanceRate),
  isLowScore: isLowLessonScore(row),
});
