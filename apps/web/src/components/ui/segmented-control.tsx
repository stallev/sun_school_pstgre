"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { segmentedChipClassName } from "@/lib/ui/segmented-chip-classes";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SegmentedControlProps<T extends string, M extends "radio" | "toggle" = "radio"> = {
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onValueChange: M extends "toggle" ? (value: T | null) => void : (value: T) => void;
  "aria-label": string;
  disabled?: boolean;
  invalid?: boolean;
  mode?: M;
  size?: "default" | "compact";
  className?: string;
};

/**
 * Single-choice chips: `mode="radio"` (WAI-ARIA radio group) or `mode="toggle"` (`aria-pressed`).
 */
export const SegmentedControl = <T extends string, M extends "radio" | "toggle" = "radio">({
  options,
  value,
  onValueChange,
  disabled = false,
  invalid = false,
  mode,
  size = "default",
  className,
  ...aria
}: SegmentedControlProps<T, M>) => {
  const resolvedMode = mode ?? "radio";
  const groupId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabledIdx = options
    .map((option, index) => (option.disabled ? -1 : index))
    .filter((index) => index >= 0);
  const activeIdx = options.findIndex((option) => option.value === value);
  const tabStop = activeIdx >= 0 ? activeIdx : (enabledIdx[0] ?? 0);

  const move = (from: number, delta: 1 | -1 | "first" | "last") => {
    if (enabledIdx.length === 0) return;
    const pos = enabledIdx.indexOf(from);
    let next: number | undefined;
    if (delta === "first") next = enabledIdx[0];
    else if (delta === "last") next = enabledIdx[enabledIdx.length - 1];
    else next = enabledIdx[(pos + delta + enabledIdx.length) % enabledIdx.length];
    if (next === undefined) return;
    const target = options[next];
    if (!target) return;
    refs.current[next]?.focus();
    onValueChange(target.value);
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    if (resolvedMode === "toggle") return;
    const keys: Record<string, 1 | -1 | "first" | "last"> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      Home: "first",
      End: "last",
    };
    const action = keys[event.key];
    if (action === undefined) return;
    event.preventDefault();
    move(index, action);
  };

  const chipClass = (checked: boolean) =>
    segmentedChipClassName(checked, { size, invalid });

  const handleSelect = (optionValue: T, checked: boolean) => {
    if (resolvedMode === "toggle" && checked) {
      (onValueChange as (value: T | null) => void)(null);
      return;
    }
    (onValueChange as (value: T) => void)(optionValue);
  };

  return (
    <div
      role={resolvedMode === "radio" ? "radiogroup" : "group"}
      aria-label={aria["aria-label"]}
      aria-invalid={invalid || undefined}
      aria-disabled={disabled || undefined}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        const isDisabled = disabled || option.disabled;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`${groupId}-${option.value}`}
            type="button"
            role={resolvedMode === "radio" ? "radio" : undefined}
            aria-checked={resolvedMode === "radio" ? checked : undefined}
            aria-pressed={resolvedMode === "toggle" ? checked : undefined}
            disabled={isDisabled}
            tabIndex={resolvedMode === "radio" ? (index === tabStop ? 0 : -1) : undefined}
            onClick={() => handleSelect(option.value, checked)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={chipClass(checked)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
