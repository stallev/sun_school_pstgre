"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LessonCheckPressToggleProps = {
  pressed: boolean;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  size?: "default" | "touch";
  onPressedChange: (pressed: boolean) => void;
};

/** Attendance and singing control shared by the table and the card stack. */
export const LessonCheckPressToggle = ({
  pressed,
  label,
  disabled = false,
  busy = false,
  size = "default",
  onPressedChange,
}: LessonCheckPressToggleProps) => (
  <button
    type="button"
    aria-pressed={pressed}
    aria-busy={busy || undefined}
    aria-label={label}
    disabled={disabled || busy}
    className={cn(
      "inline-flex items-center justify-center border border-line bg-surface transition-[color,background-color,border-color] duration-100 ease-out-soft hover:bg-paper disabled:pointer-events-none disabled:opacity-45",
      size === "touch" ? "min-h-11 min-w-11 rounded-lg" : "size-9 rounded-lg max-md:relative max-md:after:absolute max-md:after:-inset-y-1 max-md:after:inset-x-0",
    )}
    onClick={() => onPressedChange(!pressed)}
  >
    {pressed ? (
      <CheckIcon className={cn(size === "touch" ? "size-5" : "size-4", "text-ok")} aria-hidden />
    ) : (
      <XIcon className={cn(size === "touch" ? "size-5" : "size-4", "text-danger")} aria-hidden />
    )}
  </button>
);
