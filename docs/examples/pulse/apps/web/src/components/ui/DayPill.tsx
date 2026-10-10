import * as React from "react";

import { cn } from "@/lib/utils";

export type DayPillProps = Omit<React.ComponentProps<"button">, "type"> & {
  weekday: string;
  day: string;
  selected?: boolean;
};

export const DayPill = React.forwardRef<HTMLButtonElement, DayPillProps>(
  function DayPill(
    {
      weekday,
      day,
      selected = false,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={cn(
          "inline-flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:bg-muted",
          className,
        )}
        {...props}
      >
        <span className="text-[11px] uppercase">{weekday}</span>
        <span className="font-heading text-lg leading-tight">{day}</span>
      </button>
    );
  },
);

DayPill.displayName = "DayPill";
