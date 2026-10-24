import { SegmentedControlLinks } from "@/components/ui/segmented-control-links";
import type { AnalyticsPeriodFilter as PeriodFilter } from "@/data/analytics/analytics-period";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

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
  return (
    <SegmentedControlLinks
      aria-label={messages.periodChipsLabel}
      value={periodFilter.mode === "year" ? "year" : "month"}
      options={[
        {
          value: "year",
          label: messages.periodYear,
          href: buildHref(gradeId, yearId, { mode: "year" }),
        },
        {
          value: "month",
          label: monthChipLabel,
          href: buildHref(gradeId, yearId, { mode: "month", month: monthChipValue }),
        },
      ]}
    />
  );
};
