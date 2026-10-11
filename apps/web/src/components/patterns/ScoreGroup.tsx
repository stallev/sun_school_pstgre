"use client";

import { AlertText } from "@/components/atoms/AlertText";
import { ScoreSelector } from "@/components/ui/score-selector";

type ScoreGroupProps = {
  label: string;
  max: number;
  value: number | null;
  onValueChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
};

/** One homework item: label + score chips + inline error. */
export const ScoreGroup = ({
  label,
  max,
  value,
  onValueChange,
  error,
  disabled,
}: ScoreGroupProps) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-ink">{label}</p>
    <ScoreSelector
      aria-label={label}
      max={max}
      value={value}
      onValueChange={onValueChange}
      invalid={Boolean(error)}
      disabled={disabled}
    />
    {error ? <AlertText>{error}</AlertText> : null}
  </div>
);
