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
  <div
    role="radiogroup"
    aria-label={messages.stripLabel}
    aria-busy={isPending}
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
            "inline-flex h-11 min-w-11 items-center rounded-lg border px-3 text-sm font-medium transition-[transform,background-color,border-color,color] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
            selected
              ? "border-ink bg-ink text-surface"
              : "border-line-strong bg-surface text-ink",
          )}
        >
          {year.name}
          {year.isActive ? ` · ${messages.activeBadge}` : ""}
        </button>
      );
    })}
  </div>
);
