"use client";

import type { ReactNode } from "react";
import { ContentText } from "@/components/atoms";
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

/** Test / notebook 0–10: always-visible keypad (same chips as table ScorePad). */
export const CheckScaleField = ({
  label,
  value,
  notRatedLabel,
  bandLabel,
  bandClassName,
  disabled = false,
  trailing,
  onValueChange,
}: CheckScaleFieldProps) => (
  <div className="space-y-2 py-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ContentText className="font-medium text-ink">{label}</ContentText>
      {trailing}
    </div>
    {bandLabel ? (
      <ContentText className={cn("text-sm", bandClassName)}>{bandLabel}</ContentText>
    ) : null}
    <div className="max-w-xs rounded-lg border border-line bg-surface p-2 shadow-float">
      <ScorePad
        layout="keypad"
        max={10}
        value={value}
        notRatedLabel={notRatedLabel}
        aria-label={label}
        disabled={disabled}
        onValueChange={onValueChange}
      />
    </div>
  </div>
);
