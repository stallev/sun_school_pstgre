import { formatAnalyticsMetricWithLessons } from "@/lib/analytics/analytics-metric-copy";
import { formatAnalyticsAttendanceRate } from "@/lib/analytics/format-analytics-display";
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

export { formatCohortAverage } from "@/lib/analytics/analytics-metric-copy";
