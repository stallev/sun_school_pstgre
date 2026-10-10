import * as React from "react";

import { cn } from "@/lib/utils";

export type TimeSlotButtonProps = Omit<
  React.ComponentProps<"button">,
  "type"
> & {
  available?: boolean;
  selected?: boolean;
};

export function TimeSlotButton({
  available = true,
  selected = false,
  className,
  children,
  disabled,
  ...props
}: TimeSlotButtonProps) {
  const isDisabled = disabled ?? !available;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg font-mono text-[13px] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        selected
          ? "border border-primary bg-primary text-primary-foreground"
          : available
            ? "border border-border bg-card text-foreground hover:border-primary hover:text-primary"
            : "cursor-not-allowed bg-[hsl(var(--color-surface-container))] text-subtle-foreground line-through",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
