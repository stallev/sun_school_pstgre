import { formatAnalyticsMetricWithLessons } from "@/lib/analytics/analytics-metric-copy";
import {
  formatAnalyticsAttendanceRate,
  formatAnalyticsAverage,
} from "@/lib/analytics/format-analytics-display";
import { formatNumber } from "@/lib/i18n/format";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

export const formatGroupScore = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
): string => formatAnalyticsMetricWithLessons(average, observationCount, messages);

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
    : formatAnalyticsAverage(
        messages.formatAverage,
        formatNumber(Number(value.toFixed(1)), messages.formatLocale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      );
