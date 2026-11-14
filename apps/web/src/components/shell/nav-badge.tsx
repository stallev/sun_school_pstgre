import { CountBadge } from "@/components/ui/count-badge";
import { cn } from "@/lib/utils";

export const formatNavBadgeCount = (count: number): string =>
  count > 99 ? "99+" : String(count);

type NavBadgeProps = {
  count: number;
  ariaLabel: string;
  className?: string;
};

export const NavBadge = ({ count, ariaLabel, className }: NavBadgeProps) => {
  if (count <= 0) return null;
  return (
    <CountBadge aria-label={ariaLabel} className={cn("ms-1.5", className)}>
      {formatNavBadgeCount(count)}
    </CountBadge>
  );
};
