import {
  formatAnalyticsAverage,
} from "@/lib/analytics/format-analytics-display";
import { formatNumber, plural } from "@/lib/i18n/format";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

export const formatAnalyticsChildrenHint = (
  messages: AnalyticsMessages,
  count: number,
): string => {
  const children = plural(messages.kpiChildrenCount, count, messages.formatLocale);
  return fillMessage(messages.kpiAttendanceHint, { children });
};

export const formatAnalyticsLessonsObserved = (
  messages: AnalyticsMessages,
  observationCount: number,
): string => plural(messages.kpiLessonsObserved, observationCount, messages.formatLocale);

export const formatAnalyticsMetricWithLessons = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
): string => {
  if (average === null || observationCount === 0) return messages.kpiEmpty;
  const formattedAverage = formatNumber(
    Number(average.toFixed(1)),
    messages.formatLocale,
    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  );
  const value = formatAnalyticsAverage(messages.formatAverage, formattedAverage);
  const base = formatAnalyticsLessonsObserved(messages, observationCount);
  return fillMessage(messages.kpiMetricWithBase, { value, base });
};
