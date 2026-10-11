import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Small numeric counter bubble (`99+` is the caller's responsibility). */
export const CountBadge = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    className={cn(
      "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cobalt-ink px-1.5 text-xs font-medium text-surface tabular-nums",
      className,
    )}
    {...props}
  />
);
