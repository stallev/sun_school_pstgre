"use client";

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
  className?: string;
};

export const YearStrip = ({
  years,
  selectedYearId,
  onSelectYear,
  messages,
  className,
}: YearStripProps) => (
  <div
    role="radiogroup"
    aria-label={messages.stripLabel}
    className={cn("mb-5 flex flex-wrap items-center gap-2", className)}
  >
    {years.map((year) => {
      const selected = year.id === selectedYearId;
      return (
        <button
          key={year.id}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onSelectYear(year.id)}
          className={cn(
            "min-h-11 rounded-lg border px-3 text-sm transition-colors",
            selected
              ? "border-cobalt-ink bg-cobalt-soft text-ink"
              : "border-line bg-surface text-ink-2 hover:border-line-strong",
          )}
        >
          {year.name}
          {year.isActive ? ` · ${messages.activeBadge}` : ""}
        </button>
      );
    })}
  </div>
);
