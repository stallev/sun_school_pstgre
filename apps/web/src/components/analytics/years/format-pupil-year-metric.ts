import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { PupilYearMetric } from "./PupilYearsSection";

export const formatPupilYearMetric = (
  metric: PupilYearMetric,
  value: number,
  messages: AnalyticsMessages,
): string => {
  if (metric === "attendance") {
    return messages.formatPercent(Number((value * 100).toFixed(0)));
  }
  return messages.formatAverage(Number(value.toFixed(1)));
};
