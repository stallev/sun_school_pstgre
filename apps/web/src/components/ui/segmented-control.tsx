"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onValueChange: (value: T) => void;
  "aria-label": string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

/**
 * Single-choice radio group rendered as chips. Roving tabindex; Arrow keys move and select,
 * Home / End jump (WAI-ARIA radio group pattern).
 */
export const SegmentedControl = <T extends string>({
  options,
  value,
  onValueChange,
  disabled = false,
  invalid = false,
  className,
  ...aria
}: SegmentedControlProps<T>) => {
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

  return (
    <div
      role="radiogroup"
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
            role="radio"
            aria-checked={checked}
            disabled={isDisabled}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border bg-surface px-3 text-[0.9375rem] font-medium text-ink transition-[color,background-color,border-color,transform] duration-100 ease-out-soft hover:bg-paper active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100",
              checked
                ? "border-cobalt-ink bg-cobalt-soft text-cobalt-ink hover:bg-cobalt-soft"
                : invalid
                  ? "border-danger"
                  : "border-input",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
