import { ArrowDown, ArrowUp } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { formatNumber } from "@/lib/i18n/format";
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

const formatDiffAmount = (
  metric: YearDiffMetric,
  delta: number,
  messages: AnalyticsYearMessages,
): string => {
  const abs = Math.abs(delta);
  if (metric === "attendance") {
    return formatNumber(abs, messages.formatLocale, { maximumFractionDigits: 0 });
  }
  return formatNumber(abs, messages.formatLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
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
  const amount = formatDiffAmount(metric, delta, messages);
  const text =
    metric === "attendance"
      ? fillMessage(higher ? messages.diffHigherAttendance : messages.diffLowerAttendance, {
          amount,
        })
      : fillMessage(higher ? messages.diffHigher : messages.diffLower, { amount });
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
