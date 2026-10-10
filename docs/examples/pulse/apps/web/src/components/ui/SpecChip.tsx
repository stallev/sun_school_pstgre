import * as React from "react";

import { cn } from "@/lib/utils";

export type SpecChipProps = React.ComponentProps<"span">;

export function SpecChip({ className, children, ...props }: SpecChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
