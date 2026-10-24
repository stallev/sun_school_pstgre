"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import type { AnalyticsYearMessages } from "@/lib/messages/analytics-messages";

export type YearStripItem = {
  id: string;
  name: string;
  isActive: boolean;
};

type YearStripProps = {
  years: readonly YearStripItem[];
  selectedYearId: string;
  onSelectYear: (yearId: string) => void;
  messages: AnalyticsYearMessages;
  isPending?: boolean;
  className?: string;
};

export const YearStrip = ({
  years,
  selectedYearId,
  onSelectYear,
  messages,
  isPending = false,
  className,
}: YearStripProps) => (
  <div aria-busy={isPending} className={cn("mb-5", className)}>
    <SegmentedControl
      mode="radio"
      size="default"
      aria-label={messages.stripLabel}
      value={selectedYearId}
      onValueChange={onSelectYear}
      disabled={isPending}
      options={years.map((year) => ({
        value: year.id,
        label: year.isActive ? `${year.name} · ${messages.activeBadge}` : year.name,
      }))}
    />
  </div>
);
