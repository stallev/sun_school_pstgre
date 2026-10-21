"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

const UNSET = "unset";

type CheckVerseFieldProps = {
  label: string;
  value: number | null;
  unsetLabel: string;
  notRatedLabel: string;
  disabled?: boolean;
  trailing?: ReactNode;
  onValueChange: (value: number | null) => void;
};

const chipClass = (checked: boolean, quiet: boolean) =>
  cn(
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-[0.9375rem] font-medium tabular-nums",
    checked
      ? "border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink"
      : quiet
        ? "border-line bg-surface text-muted"
        : "border-input bg-surface text-ink hover:bg-paper",
  );

/** Verse radiogroup: tiles 0–2 and a quiet «not set» control. */
export const CheckVerseField = ({
  label,
  value,
  unsetLabel,
  notRatedLabel,
  disabled = false,
  trailing,
  onValueChange,
}: CheckVerseFieldProps) => {
  const groupId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const options = ["0", "1", "2", UNSET] as const;
  const selected = value === null ? UNSET : String(value);
  const tabStop = Math.max(0, options.indexOf(selected as (typeof options)[number]));

  const pick = (next: string) => onValueChange(next === UNSET ? null : Number(next));

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
        : event.key === "Home" ? "first"
          : event.key === "End" ? "last"
            : null;
    if (step === null) return;
    event.preventDefault();
    const next = step === "first" ? 0 : step === "last" ? options.length - 1
      : (index + step + options.length) % options.length;
    refs.current[next]?.focus();
    pick(options[next] ?? UNSET);
  };

  return (
    <div className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ContentText className="font-medium text-ink">{label}</ContentText>
        {trailing}
      </div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1">
        {options.map((option, index) => (
          <button
            key={option}
            ref={(node) => { refs.current[index] = node; }}
            id={`${groupId}-${option}`}
            type="button"
            role="radio"
            aria-checked={selected === option}
            aria-label={option === UNSET ? notRatedLabel : option}
            disabled={disabled}
            tabIndex={index === tabStop ? 0 : -1}
            className={chipClass(selected === option, option === UNSET)}
            onClick={() => pick(option)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {option === UNSET ? unsetLabel : option}
          </button>
        ))}
      </div>
    </div>
  );
};
