"use client";

import { useMemo, type ReactNode } from "react";
import { AlertText } from "@/components/atoms/AlertText";
import { SegmentedControl } from "@/components/ui/segmented-control";

const NULL_SCORE = "null";

type ScoreGroupProps = {
  label: string;
  max: number;
  value: number | null;
  onValueChange: (value: number | null) => void;
  notRatedLabel: string;
  error?: string;
  disabled?: boolean;
  trailing?: ReactNode;
};

/** Score radiogroup with «—» = null (flow spec §5.3). */
export const ScoreGroup = ({
  label,
  max,
  value,
  onValueChange,
  notRatedLabel,
  error,
  disabled,
  trailing,
}: ScoreGroupProps) => {
  const options = useMemo(() => {
    const scores = Array.from({ length: max + 1 }, (_, score) => ({
      value: String(score),
      label: String(score),
    }));
    return [{ value: NULL_SCORE, label: "—", ariaLabel: notRatedLabel }, ...scores];
  }, [max, notRatedLabel]);

  const controlValue = value === null ? NULL_SCORE : String(value);

  return (
    <div className="space-y-2 border-b border-line py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        {trailing}
      </div>
      <SegmentedControl
        aria-label={label}
        options={options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        value={controlValue}
        onValueChange={(next) => onValueChange(next === NULL_SCORE ? null : Number(next))}
        invalid={Boolean(error)}
        disabled={disabled}
        className="grid grid-cols-6 gap-1 sm:grid-cols-12"
      />
      {error ? <AlertText>{error}</AlertText> : null}
    </div>
  );
};
