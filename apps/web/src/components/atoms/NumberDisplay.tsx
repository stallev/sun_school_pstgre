import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Large counter / score; `tabular-nums` so columns of numbers align. */
export const NumberDisplay = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    className={cn("font-display text-3xl text-ink tabular-nums", className)}
    {...props}
  />
);
