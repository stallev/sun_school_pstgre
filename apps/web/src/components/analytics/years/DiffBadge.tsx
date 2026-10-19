import { ArrowDown, ArrowUp } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import type { AnalyticsYearMessages } from "@/lib/messages/analytics-messages";

export type YearDiffMetric = "attendance" | "verses" | "test" | "notebook";

type DiffBadgeProps = {
  metric: YearDiffMetric;
  delta: number | null;
  comparisonReliable: boolean;
  previousYearName?: string;
  messages: AnalyticsYearMessages;
};

const formatAmount = (metric: YearDiffMetric, delta: number): string => {
  const abs = Math.abs(delta);
  if (metric === "attendance") return String(abs);
  return abs.toFixed(1).replace(".", ",");
};

export const DiffBadge = ({
  metric,
  delta,
  comparisonReliable,
  previousYearName,
  messages,
}: DiffBadgeProps) => {
  if (!comparisonReliable) {
    return (
      <span className="text-xs text-muted-foreground">{messages.insufficientForComparison}</span>
    );
  }
  if (delta === null) return null;
  if (delta === 0) {
    return (
      <span className="text-xs text-ink-2" title={previousYearName}>
        {messages.diffSame}
      </span>
    );
  }
  const higher = delta > 0;
  const amount = formatAmount(metric, delta);
  const unit =
    metric === "attendance" ? ` ${messages.diffPointsUnit}` : "";
  const text = higher ? messages.diffHigher(amount, unit) : messages.diffLower(amount, unit);
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-ink-2"
      title={previousYearName}
    >
      <Icon icon={higher ? ArrowUp : ArrowDown} className="size-3.5 shrink-0" />
      <span>{text}</span>
    </span>
  );
};
