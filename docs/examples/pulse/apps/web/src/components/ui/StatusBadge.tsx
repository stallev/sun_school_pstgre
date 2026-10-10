import * as React from "react";

import {
  STATUS_BADGE_CLASSES,
  type StatusBadgeVariant,
} from "@/lib/ui/status-badge";
import { cn } from "@/lib/utils";

export type StatusBadgeProps = React.ComponentProps<"span"> & {
  status?: StatusBadgeVariant;
  icon?: React.ReactNode;
};

export function StatusBadge({
  status = "neutral",
  icon,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5",
        STATUS_BADGE_CLASSES[status],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
