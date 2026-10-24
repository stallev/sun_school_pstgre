"use client";

import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import type { AnalyticsPeriodFilter as PeriodFilter } from "@/data/analytics/analytics-period";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type AnalyticsPeriodFilterProps = {
  gradeId: string;
  periodFilter: PeriodFilter;
  messages: AnalyticsMessages;
  actionPath?: string;
  hiddenFields?: Record<string, string>;
};

export const AnalyticsPeriodFilter = ({
  gradeId,
  periodFilter,
  messages,
  actionPath = "/analytics",
  hiddenFields,
}: AnalyticsPeriodFilterProps) => {
  const mode = periodFilter.mode;
  const monthDefault = periodFilter.mode === "month" ? periodFilter.month : "";
  const fromDefault = periodFilter.mode === "range" ? periodFilter.from : "";
  const toDefault = periodFilter.mode === "range" ? periodFilter.to : "";

  return (
    <form method="get" action={actionPath} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="gradeId" value={gradeId} />
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <label className="grid gap-1">
        <ContentText className="text-base font-medium text-ink">{messages.periodYear}</ContentText>
        <FormSelect
          name="mode"
          defaultValue={mode}
          options={[
            { value: "year", label: messages.periodYear },
            { value: "month", label: messages.periodMonth },
            { value: "range", label: messages.periodRange },
          ]}
        />
      </label>
      <label className="grid gap-1">
        <ContentText className="text-base font-medium text-ink">{messages.monthLabel}</ContentText>
        <input
          type="month"
          name="month"
          defaultValue={monthDefault}
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base text-ink"
        />
      </label>
      <label className="grid gap-1">
        <ContentText className="text-base font-medium text-ink">{messages.rangeFrom}</ContentText>
        <input
          type="date"
          name="from"
          defaultValue={fromDefault}
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base text-ink"
        />
      </label>
      <label className="grid gap-1">
        <ContentText className="text-base font-medium text-ink">{messages.rangeTo}</ContentText>
        <input
          type="date"
          name="to"
          defaultValue={toDefault}
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base text-ink"
        />
      </label>
      <Button type="submit" variant="outline">{messages.periodApply}</Button>
    </form>
  );
};
