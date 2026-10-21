"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { ContentText } from "@/components/atoms";
import { ScorePad } from "@/components/ui/score-pad";
import { cn } from "@/lib/utils";

type CheckScaleFieldProps = {
  fieldKey: string;
  label: string;
  value: number | null;
  open: boolean;
  notRatedLabel: string;
  bandLabel: string;
  bandClassName: string;
  disabled?: boolean;
  trailing?: ReactNode;
  onOpenChange: (key: string | null) => void;
  onValueChange: (value: number | null) => void;
};

const digitClass = (bandClassName: string) =>
  cn("font-display text-[2.5rem] leading-none tabular-nums", bandClassName || "text-ink");

/** Large 0–10 digit. Choosing a value writes the local form and closes the pad. */
export const CheckScaleField = ({
  fieldKey,
  label,
  value,
  open,
  notRatedLabel,
  bandLabel,
  bandClassName,
  disabled = false,
  trailing,
  onOpenChange,
  onValueChange,
}: CheckScaleFieldProps) => {
  const padId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="space-y-1 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ContentText className="font-medium text-ink">{label}</ContentText>
        {trailing}
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? padId : undefined}
        aria-label={label}
        className={digitClass(bandClassName)}
        onClick={() => onOpenChange(open ? null : fieldKey)}
      >
        {value === null ? "—" : value}
      </button>
      {bandLabel ? <ContentText className={cn("text-sm", bandClassName)}>{bandLabel}</ContentText> : null}
      {open ? (
        <div id={padId} className="max-w-xs">
          <ScorePad
            layout="keypad"
            max={10}
            value={value}
            notRatedLabel={notRatedLabel}
            aria-label={label}
            disabled={disabled}
            onValueChange={(next) => {
              onValueChange(next);
              onOpenChange(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
