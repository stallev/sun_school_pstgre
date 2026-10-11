"use client";

import { useMemo } from "react";
import { SegmentedControl } from "./segmented-control";

type ScoreSelectorProps = {
  /** Maximum score of the item (options are 0…max). */
  max: number;
  value: number | null;
  onValueChange: (value: number) => void;
  "aria-label": string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

/** Numeric score chips 0…max built on `SegmentedControl` (keyboard: arrows, Home, End). */
export const ScoreSelector = ({
  max,
  value,
  onValueChange,
  ...rest
}: ScoreSelectorProps) => {
  const options = useMemo(
    () =>
      Array.from({ length: max + 1 }, (_, score) => ({
        value: String(score),
        label: String(score),
      })),
    [max],
  );
  return (
    <SegmentedControl
      options={options}
      value={value === null ? null : String(value)}
      onValueChange={(next) => onValueChange(Number(next))}
      {...rest}
    />
  );
};
