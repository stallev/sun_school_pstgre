import { SAMPLE_LAYER, type SampleLayer } from "@sunschool/domain";
import {
  formatAnalyticsAverage,
} from "@/lib/analytics/format-analytics-display";
import { formatDecimalOne, plural } from "@/lib/i18n/format";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { SchoolGroupRow } from "@/data/analytics/load-school-analytics-page.server";

export const formatAnalyticsRegularlyAttendLine = (
  messages: AnalyticsMessages,
  sampleCounts: Record<SampleLayer, number>,
): string => {
  const regular = sampleCounts[SAMPLE_LAYER.A];
  const total =
    sampleCounts[SAMPLE_LAYER.A] +
    sampleCounts[SAMPLE_LAYER.B] +
    sampleCounts[SAMPLE_LAYER.C] +
    sampleCounts[SAMPLE_LAYER.D];
  return fillMessage(messages.kpiAttendanceHint, { regular, total });
};

/** @deprecated Use formatAnalyticsRegularlyAttendLine */
export const formatAnalyticsChildrenHint = (
  messages: AnalyticsMessages,
  count: number,
): string => formatAnalyticsRegularlyAttendLine(messages, {
  [SAMPLE_LAYER.A]: count,
  [SAMPLE_LAYER.B]: 0,
  [SAMPLE_LAYER.C]: 0,
  [SAMPLE_LAYER.D]: 0,
});

export const formatAnalyticsLessonsObserved = (
  messages: AnalyticsMessages,
  observationCount: number,
): string => plural(messages.kpiLessonsObserved, observationCount, messages.formatLocale);

export const formatAnalyticsMetricAverage = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
): string | null => {
  if (average === null || observationCount === 0) return null;
  return formatAnalyticsAverage(
    messages.formatAverage,
    formatDecimalOne(average, messages.formatLocale),
  );
};

export const formatAnalyticsMetricWithLessons = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
): string => {
  const value = formatAnalyticsMetricAverage(average, observationCount, messages);
  if (value === null) return messages.kpiEmpty;
  const base = formatAnalyticsLessonsObserved(messages, observationCount);
  return fillMessage(messages.kpiMetricWithBase, { value, base });
};

export const formatSchoolGroupScoreAverage = (
  scoreAverage: number | null,
  averageTemplate: string,
  locale: AnalyticsMessages["formatLocale"],
  empty: string,
): string => {
  if (scoreAverage === null) return empty;
  return formatAnalyticsAverage(averageTemplate, formatDecimalOne(scoreAverage, locale));
};

export const formatSchoolLastLessonLabel = (
  row: Pick<SchoolGroupRow, "lastLessonStatus" | "lastLessonChecked" | "lastLessonTotal">,
  messages: AnalyticsMessages["school"],
): string => {
  if (row.lastLessonStatus === "idle") return messages.lastLessonIdle;
  return fillMessage(
    row.lastLessonStatus === "ok" ? messages.lastLessonOk : messages.lastLessonWarn,
    { checked: row.lastLessonChecked, total: row.lastLessonTotal },
  );
};

export const formatCohortAverage = (
  value: number | null,
  messages: AnalyticsMessages,
): string => {
  if (value === null) return messages.kpiEmpty;
  return formatAnalyticsAverage(
    messages.formatAverage,
    formatDecimalOne(value, messages.formatLocale),
  );
};
