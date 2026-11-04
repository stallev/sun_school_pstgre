import {
  formatAnalyticsAttendanceRate,
  formatAnalyticsAverage,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

export const formatGroupScore = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
): string => {
  if (average === null || observationCount === 0) return messages.kpiEmpty;
  return fillMessage(messages.kpiWithN, {
    value: formatAnalyticsAverage(messages.formatAverage, Number(average.toFixed(1))),
    n: observationCount,
  });
};

export const formatCohortPercent = (
  value: number | null,
  messages: AnalyticsMessages,
): string =>
  formatAnalyticsAttendanceRate(messages.formatPercent, value, messages.kpiEmpty);

export const formatCohortAverage = (
  value: number | null,
  messages: AnalyticsMessages,
): string =>
  value === null
    ? messages.kpiEmpty
    : formatAnalyticsAverage(messages.formatAverage, Number(value.toFixed(1)));
