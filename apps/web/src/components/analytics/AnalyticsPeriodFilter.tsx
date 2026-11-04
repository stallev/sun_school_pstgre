"use client";

import { useState } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormSelect } from "@/components/ui/form-select";
import type { FormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import type { AnalyticsPeriodFilter as PeriodFilter } from "@/data/analytics/analytics-period";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type AnalyticsPeriodFilterProps = {
  gradeId: string;
  periodFilter: PeriodFilter;
  messages: AnalyticsMessages;
  actionPath?: string;
  hiddenFields?: Record<string, string>;
  dateFieldCopy: FormDateFieldCopy;
  isPeriodApplied?: boolean;
};

export const AnalyticsPeriodFilter = ({
  gradeId,
  periodFilter,
  messages,
  actionPath = "/analytics",
  hiddenFields,
  dateFieldCopy,
  isPeriodApplied = false,
}: AnalyticsPeriodFilterProps) => {
  const [mode, setMode] = useState(periodFilter.mode);
  const monthDefault = periodFilter.mode === "month" ? periodFilter.month : "";
  const fromDefault = periodFilter.mode === "range" ? periodFilter.from : "";
  const toDefault = periodFilter.mode === "range" ? periodFilter.to : "";

  return (
    <form method="get" action={actionPath} className="flex flex-col gap-2">
      <fieldset className="flex min-w-0 flex-wrap items-end gap-3 border-0 p-0">
        <legend className="sr-only">{messages.periodControlLabel}</legend>
        <input type="hidden" name="gradeId" value={gradeId} />
        {hiddenFields
          ? Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))
          : null}
        <label className="grid gap-1">
          <ContentText className="text-base font-medium text-ink">{messages.periodControlLabel}</ContentText>
          <FormSelect
            name="mode"
            value={mode}
            onValueChange={(next) => setMode(next as PeriodFilter["mode"])}
            aria-label={messages.periodControlLabel}
            options={[
              { value: "year", label: messages.periodYear },
              { value: "month", label: messages.periodMonth },
              { value: "range", label: messages.periodRange },
            ]}
          />
        </label>
        {mode === "month" ? (
          <label className="grid gap-1">
            <ContentText className="sr-only">{messages.periodMonth}</ContentText>
            <input
              type="month"
              name="month"
              defaultValue={monthDefault}
              aria-label={messages.periodMonth}
              className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base text-ink"
            />
          </label>
        ) : null}
        {mode === "range" ? (
          <>
            <label className="grid gap-1">
              <ContentText className="sr-only">{messages.rangeFrom}</ContentText>
              <FormDateField
                name="from"
                defaultValue={fromDefault}
                locale={dateFieldCopy.locale}
                calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
                className="max-w-none"
              />
            </label>
            <label className="grid gap-1">
              <ContentText className="sr-only">{messages.rangeTo}</ContentText>
              <FormDateField
                name="to"
                defaultValue={toDefault}
                locale={dateFieldCopy.locale}
                calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
                className="max-w-none"
              />
            </label>
          </>
        ) : null}
        <Button type="submit" variant="outline">
          {messages.periodApply}
        </Button>
      </fieldset>
      {isPeriodApplied ? (
        <ContentText className="text-sm text-muted" role="status">
          {messages.periodApplied}
        </ContentText>
      ) : null}
    </form>
  );
};
