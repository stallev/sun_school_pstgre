import { CountBadge } from "@/components/ui/count-badge";

const formatBadgeCount = (count: number): string => (count > 99 ? "99+" : String(count));

type NavBadgeProps = {
  count: number;
  ariaLabel: string;
};

export const NavBadge = ({ count, ariaLabel }: NavBadgeProps) => {
  if (count <= 0) return null;
  return (
    <CountBadge aria-label={ariaLabel} className="ms-1.5">
      {formatBadgeCount(count)}
    </CountBadge>
  );
};
