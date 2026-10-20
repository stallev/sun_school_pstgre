import { ArrowDown, ArrowUp } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { fillMessage } from "@/lib/messages/fill-message";
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

const formatAmount = (metric: YearDiffMetric, delta: number): string => {
  const abs = Math.abs(delta);
  if (metric === "attendance") return String(abs);
  return abs.toFixed(1).replace(".", ",");
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
  if (delta === 0) {
    return (
      <span className="text-sm text-ink-2" title={previousYearName}>
        {messages.diffSame}
      </span>
    );
  }
  const higher = delta > 0;
  const amount = formatAmount(metric, delta);
  const unit =
    metric === "attendance" ? ` ${messages.diffPointsUnit}` : "";
  const text = fillMessage(higher ? messages.diffHigher : messages.diffLower, { amount, unit });
  return (
    <span
      className="inline-flex items-center gap-1 text-sm text-ink-2"
      title={previousYearName}
    >
      <Icon icon={higher ? ArrowUp : ArrowDown} className="size-3.5 shrink-0" />
      <span>{text}</span>
    </span>
  );
};
