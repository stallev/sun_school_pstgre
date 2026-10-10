import * as React from "react";

import { cn } from "@/lib/utils";

export type ChoiceCardProps = Omit<
  React.ComponentProps<"button">,
  "type"
> & {
  selected?: boolean;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function ChoiceCard({
  selected = false,
  title,
  meta,
  trailing,
  className,
  children,
  ...props
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "w-full rounded-2xl border-2 p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary-container/30"
          : "border-border bg-card hover:bg-muted/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-heading text-[17px] leading-tight">{title}</div>
          {meta ? (
            <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
          ) : null}
        </div>
        {trailing ? (
          <div className="shrink-0 font-heading text-xl leading-none">{trailing}</div>
        ) : null}
      </div>
      {children}
    </button>
  );
}
