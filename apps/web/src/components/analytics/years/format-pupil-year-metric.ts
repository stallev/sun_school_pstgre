import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { formatDecimalOne } from "@/lib/i18n/format";
import type { AnalyticsMessages, AnalyticsPupilYearMessages } from "@/lib/messages/analytics-messages";
import type { PupilYearMetric } from "./PupilYearsSection";

export const formatPupilYearMetric = (
  metric: PupilYearMetric,
  value: number,
  messages: AnalyticsMessages,
): string => {
  if (metric === "attendance") {
    return formatAnalyticsPercent(messages.formatPercent, value);
  }
  return formatAnalyticsAverage(
    messages.formatAverage,
    formatDecimalOne(value, messages.formatLocale),
  );
};

export const pupilYearChartAria = (
  messages: AnalyticsPupilYearMessages,
  metric: PupilYearMetric,
): string => {
  switch (metric) {
    case "attendance":
      return messages.chartAriaAttendance;
    case "verses":
      return messages.chartAriaVerses;
    case "test":
      return messages.chartAriaTest;
    case "notebook":
      return messages.chartAriaNotebook;
  }
};
