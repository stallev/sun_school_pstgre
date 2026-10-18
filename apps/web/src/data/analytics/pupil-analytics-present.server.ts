import "server-only";

import {
  classifyTrendSlope,
  collectReportAverageScores,
  isMainSampleLayer,
  successiveDifferences,
  TREND_LABEL,
  TREND_MIN_POINTS,
  type ScoreAverageResult,
  type TrendLabel,
} from "@sunschool/domain";
import type { AnalyticsChartPoint } from "./analytics-compute.server";
import type { PupilAnalyticsSnapshot, PupilLessonAnalyticsRow } from "./get-pupil-analytics";

export type PupilPresenceSegment = {
  lessonId: string;
  lessonDate: string;
  state: "present" | "absent" | "missing";
};

export type PupilAnalyticsView = {
  attendanceCheckedLabel: string | null;
  versesAverage: ScoreAverageResult;
  testAverage: ScoreAverageResult;
  notebookAverage: ScoreAverageResult;
  isInMainSample: boolean;
  presence: PupilPresenceSegment[];
  charts: {
    verses: AnalyticsChartPoint[];
    test: AnalyticsChartPoint[];
    notebook: AnalyticsChartPoint[];
  };
  dynamics: {
    normalized: AnalyticsChartPoint[];
    smoothed: AnalyticsChartPoint[];
    deltaLabels: string[];
    deltaValues: (number | null)[];
    trendLabel: TrendLabel;
    trendSlope: number | null;
    trendPointCount: number;
  };
};

const chartPoint = (
  row: PupilLessonAnalyticsRow,
  value: number | null,
): AnalyticsChartPoint => ({
  lessonId: row.lessonId,
  lessonDate: row.lessonDate,
  value,
  observationCount: value === null ? 0 : 1,
});

const buildVersesPoint = (row: PupilLessonAnalyticsRow): AnalyticsChartPoint => {
  if (row.versesRecited === null || row.versesTotal === null) {
    return chartPoint(row, null);
  }
  return chartPoint(row, row.versesRecited);
};

const buildScorePoint = (
  row: PupilLessonAnalyticsRow,
  score: number | null,
  conducted: boolean,
): AnalyticsChartPoint => {
  if (!conducted) return chartPoint(row, null);
  return chartPoint(row, score);
};

export const buildPupilAnalyticsView = (
  snapshot: PupilAnalyticsSnapshot,
  formatAttendanceChecked: (attended: number, checked: number) => string,
): PupilAnalyticsView => {
  const lessons = snapshot.lessons;
  const attended = lessons.filter((row) => row.present === true).length;
  const checked = lessons.length;

  const versesAverage = collectReportAverageScores(
    lessons.map((row) => ({
      present: row.present ?? false,
      submittedLate: row.submittedLate,
      score: row.versesRecited,
    })),
  );
  const testAverage = collectReportAverageScores(
    lessons.map((row) => ({
      present: row.present ?? false,
      submittedLate: row.submittedLate,
      score: row.testConducted ? row.testScore : null,
    })),
  );
  const notebookAverage = collectReportAverageScores(
    lessons.map((row) => ({
      present: row.present ?? false,
      submittedLate: row.submittedLate,
      score: row.notebookScore,
    })),
  );

  const presence: PupilPresenceSegment[] = lessons.map((row) => {
    if (!row.homeworkChecked || row.present === null) {
      return { lessonId: row.lessonId, lessonDate: row.lessonDate, state: "missing" };
    }
    return {
      lessonId: row.lessonId,
      lessonDate: row.lessonDate,
      state: row.present ? "present" : "absent",
    };
  });

  const smoothedPairs = snapshot.dynamics.smoothed
    .map((row) => row)
    .filter((row): row is typeof row & { percent: number } => row.percent !== null);
  const smoothedPercents = smoothedPairs.map((row) => row.percent);
  const rawDeltas = successiveDifferences(smoothedPercents);
  const deltaLabels = smoothedPairs.slice(1).map((row) => row.lessonDate);
  const deltaValues: (number | null)[] = rawDeltas.map((value) => value);

  const trend = snapshot.dynamics.trendSlope;
  const trendLabel: TrendLabel =
    snapshot.dynamics.trendPointCount >= TREND_MIN_POINTS && trend !== null
      ? classifyTrendSlope(trend)
      : TREND_LABEL.INSUFFICIENT_DATA;

  return {
    attendanceCheckedLabel: checked > 0 ? formatAttendanceChecked(attended, checked) : null,
    versesAverage,
    testAverage,
    notebookAverage,
    isInMainSample: isMainSampleLayer(snapshot.sampleLayer),
    presence,
    charts: {
      verses: lessons.map(buildVersesPoint),
      test: lessons.map((row) => buildScorePoint(row, row.testScore, row.testConducted)),
      notebook: lessons.map((row) => buildScorePoint(row, row.notebookScore, true)),
    },
    dynamics: {
      normalized: snapshot.dynamics.normalizedPoints.map((row) => ({
        lessonId: row.lessonId,
        lessonDate: row.lessonDate,
        value: row.percent,
        observationCount: row.percent === null ? 0 : 1,
      })),
      smoothed: snapshot.dynamics.smoothed.map((row) => ({
        lessonId: row.lessonId,
        lessonDate: row.lessonDate,
        value: row.percent,
        observationCount: row.percent === null ? 0 : 1,
      })),
      deltaLabels,
      deltaValues,
      trendLabel,
      trendSlope: snapshot.dynamics.trendSlope,
      trendPointCount: snapshot.dynamics.trendPointCount,
    },
  };
};
