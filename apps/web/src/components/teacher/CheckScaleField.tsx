"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { ContentText, NumberDisplay } from "@/components/atoms";
import { ScorePad } from "@/components/ui/score-pad";
import { cn } from "@/lib/utils";

type CheckScaleFieldProps = {
  label: string;
  value: number | null;
  notRatedLabel: string;
  bandLabel: string;
  bandClassName: string;
  disabled?: boolean;
  trailing?: ReactNode;
  onValueChange: (value: number | null) => void;
};

const displayScore = (value: number | null) => (value === null ? "—" : String(value));

/** Test / notebook 0–10: inline row on lg+, quiet digit + keypad below lg. */
export const CheckScaleField = ({
  label,
  value,
  notRatedLabel,
  bandLabel,
  bandClassName,
  disabled = false,
  trailing,
  onValueChange,
}: CheckScaleFieldProps) => {
  const padId = useId();
  const [padOpen, setPadOpen] = useState(false);
  const triggerLabel = `${label}: ${displayScore(value)}`;

  const pickMobile = (next: number | null) => {
    onValueChange(next);
    setPadOpen(false);
  };

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setPadOpen(false);
    }
  };

  return (
    <div className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ContentText className="font-medium text-ink">{label}</ContentText>
        {trailing}
      </div>
      {bandLabel ? (
        <ContentText className={cn("text-sm", bandClassName)}>{bandLabel}</ContentText>
      ) : null}
      <div className="hidden xl:block">
        <ScorePad
          layout="inline"
          max={10}
          value={value}
          notRatedLabel={notRatedLabel}
          aria-label={label}
          disabled={disabled}
          onValueChange={onValueChange}
        />
      </div>
      <div className="xl:hidden">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={padOpen}
          aria-controls={padOpen ? padId : undefined}
          aria-label={triggerLabel}
          className="inline-flex min-h-11 min-w-[3rem] items-center justify-center rounded-lg border border-line bg-surface px-3 tabular-nums hover:border-ink-2 disabled:opacity-45"
          onClick={() => setPadOpen((open) => !open)}
          onKeyDown={onTriggerKeyDown}
        >
          <NumberDisplay className="text-[1.75rem] leading-none">{displayScore(value)}</NumberDisplay>
        </button>
        {padOpen ? (
          <div
            id={padId}
            className="mt-2 max-w-xs rounded-lg border border-line bg-surface p-2 shadow-float"
          >
            <ScorePad
              layout="keypad"
              max={10}
              value={value}
              notRatedLabel={notRatedLabel}
              aria-label={label}
              disabled={disabled}
              onValueChange={pickMobile}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
