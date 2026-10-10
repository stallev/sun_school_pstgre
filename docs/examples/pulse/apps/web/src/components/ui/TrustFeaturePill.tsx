import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type TrustFeaturePillProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function TrustFeaturePill({
  icon: Icon,
  children,
  className,
}: TrustFeaturePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground shadow-sm",
        className,
      )}
    >
      <Icon aria-hidden className="size-3 shrink-0" strokeWidth={2.25} />
      {children}
    </span>
  );
}
