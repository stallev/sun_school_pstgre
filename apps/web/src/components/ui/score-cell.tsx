"use client";

import { Popover } from "@base-ui/react/popover";
import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { ScorePad } from "@/components/ui/score-pad";
import { useMdUp } from "@/lib/ui/use-md-up";
import { cn } from "@/lib/utils";

export type ScoreCellMode = "verse" | "pad";

type ScoreCellProps = {
  mode: ScoreCellMode;
  max: number;
  value: number | null;
  onValueChange: (value: number | null) => void;
  notRatedLabel: string;
  "aria-label": string;
  cellKey: string;
  openCellKey: string | null;
  onOpenCellKeyChange: (key: string | null) => void;
  disabled?: boolean;
  "aria-busy"?: boolean;
  className?: string;
};

const scoreTone = (value: number | null) => {
  if (value === null) return "";
  if (value >= 8) return "text-ok";
  if (value <= 4) return "text-danger";
  return "";
};

const displayValue = (value: number | null) => (value === null ? "—" : String(value));

/** Quiet table score cell: inline verses or popover / expand pad for 0–10. */
export const ScoreCell = ({
  mode,
  max,
  value,
  onValueChange,
  notRatedLabel,
  cellKey,
  openCellKey,
  onOpenCellKeyChange,
  disabled = false,
  "aria-busy": ariaBusy,
  className,
  ...aria
}: ScoreCellProps) => {
  const padId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const mdUp = useMdUp();
  const isOpen = openCellKey === cellKey;

  const close = () => onOpenCellKeyChange(null);

  const handleSelect = (next: number | null) => {
    onValueChange(next);
    close();
  };

  const toggleOpen = () => {
    if (disabled) return;
    onOpenCellKeyChange(isOpen ? null : cellKey);
  };

  useEffect(() => {
    if (!isOpen || mdUp) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenCellKeyChange(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isOpen, mdUp, onOpenCellKeyChange]);

  const layout = mode === "verse" ? "inline" : "keypad";
  const triggerLabel = `${aria["aria-label"]}: ${displayValue(value)}`;
  const triggerClass = cn(
    "inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md border border-line bg-surface px-2 text-sm tabular-nums hover:border-ink-2",
    mode === "pad" && scoreTone(value),
    disabled && "pointer-events-none opacity-45",
  );

  const padPanel = (
    <ScorePad
      layout={layout}
      max={max}
      value={value}
      onValueChange={handleSelect}
      notRatedLabel={notRatedLabel}
      aria-label={aria["aria-label"]}
      disabled={disabled}
      aria-busy={ariaBusy}
    />
  );

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  if (mdUp) {
    return (
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (open) onOpenCellKeyChange(cellKey);
          else if (openCellKey === cellKey) onOpenCellKeyChange(null);
        }}
      >
        <Popover.Trigger
          nativeButton
          disabled={disabled}
          aria-busy={ariaBusy || undefined}
          aria-label={triggerLabel}
          className={triggerClass}
          onKeyDown={onTriggerKeyDown}
        >
          {displayValue(value)}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" collisionAvoidance={{ side: "flip" }}>
            <Popover.Popup
              id={padId}
              className="z-50 rounded-lg border border-line bg-surface p-2 shadow-float outline-none"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                }
              }}
            >
              {padPanel}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-busy={ariaBusy || undefined}
        aria-controls={isOpen ? padId : undefined}
        aria-label={triggerLabel}
        className={triggerClass}
        onClick={toggleOpen}
        onKeyDown={onTriggerKeyDown}
      >
        {displayValue(value)}
      </button>
      {isOpen ? (
        <div id={padId} className="mt-2">
          {padPanel}
        </div>
      ) : null}
    </div>
  );
};
