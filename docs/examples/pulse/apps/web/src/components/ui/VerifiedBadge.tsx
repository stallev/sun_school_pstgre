import { CheckIcon } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

export type VerifiedBadgeProps = Omit<
  React.ComponentProps<typeof StatusBadge>,
  "status" | "icon"
> & {
  iconOnly?: boolean;
};

export function VerifiedBadge({
  children = "Verified",
  iconOnly = false,
  className,
  ...props
}: VerifiedBadgeProps) {
  return (
    <StatusBadge
      status="verified"
      icon={<CheckIcon aria-hidden className="size-3" strokeWidth={3} />}
      className={cn(iconOnly && "gap-0 px-1.5 py-0.5 text-[11px]", className)}
      {...props}
    >
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </StatusBadge>
  );
}
