import * as React from "react";

import { cn } from "@/lib/utils";

export type FilterChipProps = Omit<
  React.ComponentProps<"button">,
  "type"
> & {
  selected?: boolean;
};

export function FilterChip({
  selected = false,
  className,
  children,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-[13px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
