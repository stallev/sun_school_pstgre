"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type ScorePadLayout = "inline" | "keypad";

type ScorePadProps = {
  max: number;
  value: number | null;
  onValueChange: (value: number | null) => void;
  layout: ScorePadLayout;
  notRatedLabel: string;
  "aria-label": string;
  disabled?: boolean;
  "aria-busy"?: boolean;
  className?: string;
};

const chipClass = (checked: boolean, invalid?: boolean) =>
  cn(
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border bg-surface px-3 text-base font-medium tabular-nums text-ink transition-[color,background-color,border-color,transform] duration-100 ease-out-soft hover:bg-paper active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100",
    checked
      ? "border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink hover:bg-cobalt-soft"
      : invalid
        ? "border-danger"
        : "border-input",
  );

const applyDigitKey = (
  key: string,
  max: number,
  pendingOne: boolean,
): { value: number | null; pendingOne: boolean } | null => {
  if (key === "Backspace") return { value: null, pendingOne: false };
  if (!/^[0-9]$/.test(key)) return null;
  const digit = Number(key);
  if (pendingOne && digit === 0 && max >= 10) return { value: 10, pendingOne: false };
  if (pendingOne) return { value: 1, pendingOne: digit === 1 };
  if (digit === 1 && max >= 10) return { value: null, pendingOne: true };
  if (digit <= max) return { value: digit, pendingOne: false };
  return null;
};

/** Score radiogroup: inline row (verses) or keypad panel (0–10 table cells). */
export const ScorePad = ({
  max,
  value,
  onValueChange,
  layout,
  notRatedLabel,
  disabled = false,
  "aria-busy": ariaBusy,
  className,
  ...aria
}: ScorePadProps) => {
  const groupId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingOneRef = useRef(false);

  const options: (number | null)[] =
    layout === "inline"
      ? [null, ...Array.from({ length: max + 1 }, (_, score) => score)]
      : [null, ...Array.from({ length: max + 1 }, (_, score) => score)];

  const enabledIdx = options.map((_, index) => index);
  const activeIdx = options.findIndex((option) => option === value);
  const tabStop = activeIdx >= 0 ? activeIdx : 0;

  const pick = (next: number | null) => {
    pendingOneRef.current = false;
    onValueChange(next);
  };

  const move = (from: number, delta: 1 | -1 | "first" | "last") => {
    if (enabledIdx.length === 0) return;
    const pos = enabledIdx.indexOf(from);
    let next: number | undefined;
    if (delta === "first") next = enabledIdx[0];
    else if (delta === "last") next = enabledIdx[enabledIdx.length - 1];
    else next = enabledIdx[(pos + delta + enabledIdx.length) % enabledIdx.length];
    if (next === undefined) return;
    refs.current[next]?.focus();
    pick(options[next] ?? null);
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    if (layout === "keypad") {
      const digitResult = applyDigitKey(event.key, max, pendingOneRef.current);
      if (digitResult) {
        event.preventDefault();
        pendingOneRef.current = digitResult.pendingOne;
        if (digitResult.value !== null || event.key === "Backspace") {
          pick(digitResult.value);
        }
        return;
      }
    }
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

  const labelFor = (option: number | null) => {
    if (option === null) return layout === "keypad" ? notRatedLabel : "—";
    return String(option);
  };

  const renderChip = (option: number | null, index: number, wide?: boolean) => {
    const checked = option === value;
    const isDisabled = disabled;
    return (
      <button
        key={option === null ? "null" : option}
        ref={(node) => {
          refs.current[index] = node;
        }}
        id={`${groupId}-${option === null ? "null" : option}`}
        type="button"
        role="radio"
        aria-checked={checked}
        disabled={isDisabled}
        aria-busy={ariaBusy || undefined}
        tabIndex={index === tabStop ? 0 : -1}
        onClick={() => pick(option)}
        onKeyDown={(event) => onKeyDown(event, index)}
        aria-label={option === null ? notRatedLabel : String(option)}
        className={cn(
          chipClass(checked),
          wide && "col-span-full w-full min-w-0",
          layout === "inline" && "min-w-[1.75rem] px-1",
        )}
      >
        {labelFor(option)}
      </button>
    );
  };

  if (layout === "keypad") {
    const low = options.slice(1, 7);
    const high = options.slice(7);
    return (
      <div
        role="radiogroup"
        aria-label={aria["aria-label"]}
        aria-disabled={disabled || undefined}
        aria-busy={ariaBusy || undefined}
        className={cn("w-full min-w-[12rem]", className)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const digitResult = applyDigitKey(event.key, max, pendingOneRef.current);
          if (!digitResult) return;
          event.preventDefault();
          pendingOneRef.current = digitResult.pendingOne;
          if (digitResult.value !== null || event.key === "Backspace") pick(digitResult.value);
        }}
      >
        {renderChip(null, 0, true)}
        <div className="mt-1 grid grid-cols-6 gap-1">
          {low.map((option, offset) => renderChip(option, offset + 1))}
        </div>
        {high.length > 0 ? (
          <div className="mt-1 grid grid-cols-5 gap-1">
            {high.map((option, offset) => renderChip(option, offset + 7))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      aria-disabled={disabled || undefined}
      aria-busy={ariaBusy || undefined}
      className={cn("inline-flex flex-wrap justify-center gap-0.5", className)}
    >
      {options.map((option, index) => renderChip(option, index))}
    </div>
  );
};
