import type { GroupAnalyticsPupilRow } from "@/data/analytics/analytics-compute.server";

export type BirthYearCohortRow = {
  birthYear: number | null;
  pupilCount: number;
  attendancePercent: number | null;
  versesAverage: number | null;
  testAverage: number | null;
  notebookAverage: number | null;
};

const mean = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const meanScores = (rows: GroupAnalyticsPupilRow[], pick: (row: GroupAnalyticsPupilRow) => number | null) => {
  const values = rows
    .map(pick)
    .filter((value): value is number => value !== null);
  return mean(values);
};

export const buildBirthYearCohortRows = (layerA: GroupAnalyticsPupilRow[]): BirthYearCohortRow[] => {
  const groups = new Map<string, GroupAnalyticsPupilRow[]>();
  for (const row of layerA) {
    const key = row.birthYear === null ? "unknown" : String(row.birthYear);
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .map(([key, pupils]) => ({
      birthYear: key === "unknown" ? null : Number(key),
      pupilCount: pupils.length,
      attendancePercent: meanScores(pupils, (row) => row.attendanceRate),
      versesAverage: meanScores(pupils, (row) => row.versesAverage.average),
      testAverage: meanScores(pupils, (row) => row.testAverage.average),
      notebookAverage: meanScores(pupils, (row) => row.notebookAverage.average),
    }))
    .sort((left, right) => (left.birthYear ?? 0) - (right.birthYear ?? 0));
};
