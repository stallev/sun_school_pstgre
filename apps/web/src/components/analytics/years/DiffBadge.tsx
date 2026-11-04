import { ArrowDown, ArrowUp } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { formatYearComparisonDiff } from "@/lib/analytics/format-analytics-display";
import type { AnalyticsYearMessages } from "@/lib/messages/analytics-messages";

export type YearDiffMetric = "attendance" | "verses" | "test" | "notebook";

type DiffBadgeProps = {
  metric: YearDiffMetric;
  delta: number | null;
  hasPreviousYear: boolean;
  comparisonReliable: boolean;
  previousYearName?: string;
  messages: AnalyticsYearMessages;
};

export const DiffBadge = ({
  metric,
  delta,
  hasPreviousYear,
  comparisonReliable,
  previousYearName,
  messages,
}: DiffBadgeProps) => {
  if (!hasPreviousYear) {
    return null;
  }
  if (!comparisonReliable) {
    return (
      <span className="text-sm text-muted-foreground">{messages.insufficientForComparison}</span>
    );
  }
  if (delta === null) return null;
  const text = formatYearComparisonDiff(metric, delta, messages, messages.formatLocale);
  const higher = delta > 0;
  return (
    <span
      className="inline-flex items-center gap-1 text-sm text-ink-2"
      title={previousYearName}
    >
      {delta !== 0 ? (
        <Icon icon={higher ? ArrowUp : ArrowDown} className="size-3.5 shrink-0" aria-hidden />
      ) : null}
      <span>{text}</span>
    </span>
  );
};
