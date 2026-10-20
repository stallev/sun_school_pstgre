import { CustomLink } from "@/components/ui/custom-link";
import type { AnalyticsPeriodFilter as PeriodFilter } from "@/data/analytics/analytics-period";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { cn } from "@/lib/utils";

type AnalyticsPeriodChipsProps = {
  gradeId: string;
  yearId: string;
  periodFilter: PeriodFilter;
  messages: AnalyticsMessages;
  monthChipValue: string;
  monthChipLabel: string;
};

const buildHref = (
  gradeId: string,
  yearId: string,
  query: Record<string, string>,
): string => {
  const params = new URLSearchParams({ gradeId, year: yearId, ...query });
  return `/analytics?${params.toString()}`;
};

export const AnalyticsPeriodChips = ({
  gradeId,
  yearId,
  periodFilter,
  messages,
  monthChipValue,
  monthChipLabel,
}: AnalyticsPeriodChipsProps) => {
  const yearActive = periodFilter.mode === "year";
  const monthActive = periodFilter.mode === "month";

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={messages.periodChipsLabel}>
      <CustomLink
        href={buildHref(gradeId, yearId, { mode: "year" })}
        role="radio"
        aria-checked={yearActive}
        className={cn(
          "inline-flex h-9 items-center rounded-lg border px-3 text-sm",
          yearActive ? "border-line-strong bg-surface font-medium text-ink" : "border-line text-ink-2",
        )}
      >
        {messages.periodYear}
      </CustomLink>
      <CustomLink
        href={buildHref(gradeId, yearId, { mode: "month", month: monthChipValue })}
        role="radio"
        aria-checked={monthActive}
        className={cn(
          "inline-flex h-9 items-center rounded-lg border px-3 text-sm",
          monthActive ? "border-line-strong bg-surface font-medium text-ink" : "border-line text-ink-2",
        )}
      >
        {monthChipLabel}
      </CustomLink>
    </div>
  );
};
