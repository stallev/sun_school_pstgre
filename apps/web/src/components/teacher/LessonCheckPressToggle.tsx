"use client";

import { CheckIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LessonCheckPressToggleProps = {
  pressed: boolean;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onPressedChange: (pressed: boolean) => void;
};

const toggleClass = (pressed: boolean) =>
  cn(
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-[color,background-color,border-color] duration-100 ease-out-soft",
    pressed
      ? "border-cobalt-ink bg-cobalt-soft text-cobalt-ink"
      : "border-input bg-surface text-ink hover:bg-paper",
  );

/** Attendance and singing control shared by the table and the card stack. */
export const LessonCheckPressToggle = ({
  pressed,
  label,
  disabled = false,
  busy = false,
  onPressedChange,
}: LessonCheckPressToggleProps) => (
  <button
    type="button"
    aria-pressed={pressed}
    aria-busy={busy || undefined}
    aria-label={label}
    disabled={disabled || busy}
    className={toggleClass(pressed)}
    onClick={() => onPressedChange(!pressed)}
  >
    {pressed ? (
      <CheckIcon className="size-5" aria-hidden />
    ) : (
      <CircleIcon className="size-5 text-muted" aria-hidden />
    )}
  </button>
);
