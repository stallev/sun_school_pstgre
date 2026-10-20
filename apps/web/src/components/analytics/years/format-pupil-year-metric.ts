import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import type { AnalyticsMessages, AnalyticsPupilYearMessages } from "@/lib/messages/analytics-messages";
import type { PupilYearMetric } from "./PupilYearsSection";

export const formatPupilYearMetric = (
  metric: PupilYearMetric,
  value: number,
  messages: AnalyticsMessages,
): string => {
  if (metric === "attendance") {
    return formatAnalyticsPercent(messages.formatPercent, Number((value * 100).toFixed(0)));
  }
  return formatAnalyticsAverage(messages.formatAverage, Number(value.toFixed(1)));
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
