import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import type { AnalyticsPeriodFilter as PeriodFilter } from "@/data/analytics/analytics-period";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type AnalyticsPeriodFilterProps = {
  gradeId: string;
  periodFilter: PeriodFilter;
  messages: AnalyticsMessages;
};

export const AnalyticsPeriodFilter = ({
  gradeId,
  periodFilter,
  messages,
}: AnalyticsPeriodFilterProps) => {
  const mode = periodFilter.mode;
  const monthDefault = periodFilter.mode === "month" ? periodFilter.month : "";
  const fromDefault = periodFilter.mode === "range" ? periodFilter.from : "";
  const toDefault = periodFilter.mode === "range" ? periodFilter.to : "";

  return (
    <form method="get" action="/analytics" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="gradeId" value={gradeId} />
      <label className="grid gap-1">
        <ContentText className="text-sm font-medium text-ink">{messages.periodYear}</ContentText>
        <select
          name="mode"
          defaultValue={mode}
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
        >
          <option value="year">{messages.periodYear}</option>
          <option value="month">{messages.periodMonth}</option>
          <option value="range">{messages.periodRange}</option>
        </select>
      </label>
      <label className="grid gap-1">
        <ContentText className="text-sm font-medium text-ink">{messages.monthLabel}</ContentText>
        <input
          type="month"
          name="month"
          defaultValue={monthDefault}
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
        />
      </label>
      <label className="grid gap-1">
        <ContentText className="text-sm font-medium text-ink">{messages.rangeFrom}</ContentText>
        <input
          type="date"
          name="from"
          defaultValue={fromDefault}
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
        />
      </label>
      <label className="grid gap-1">
        <ContentText className="text-sm font-medium text-ink">{messages.rangeTo}</ContentText>
        <input
          type="date"
          name="to"
          defaultValue={toDefault}
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
        />
      </label>
      <Button type="submit" variant="outline">{messages.periodApply}</Button>
    </form>
  );
};
