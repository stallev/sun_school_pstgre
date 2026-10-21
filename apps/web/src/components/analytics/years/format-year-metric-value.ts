import type { GroupYearTotals } from "@sunschool/domain";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { YearDiffMetric } from "./DiffBadge";

export const formatYearMetricValue = (
  key: YearDiffMetric,
  totals: GroupYearTotals | null,
  messages: AnalyticsMessages,
): string => {
  if (!totals) return messages.kpiEmpty;
  const value = totals[key];
  if (value === null) return messages.kpiEmpty;
  if (key === "attendance") {
    return formatAnalyticsPercent(messages.formatPercent, Number((value * 100).toFixed(0)));
  }
  return formatAnalyticsAverage(messages.formatAverage, Number(value.toFixed(1)));
};
