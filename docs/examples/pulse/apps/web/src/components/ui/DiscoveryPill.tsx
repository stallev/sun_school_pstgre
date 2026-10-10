import Link from "next/link";

import { cn } from "@/lib/utils";

export type DiscoveryPillProps = {
  href: string;
  label: React.ReactNode;
  count?: React.ReactNode;
  className?: string;
};

export function DiscoveryPill({
  href,
  label,
  count,
  className,
}: DiscoveryPillProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-card px-[26px] py-3.5 text-[15px] font-medium shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <span>{label}</span>
      {count ? (
        <span className="text-[12px] text-subtle-foreground transition-colors group-hover:text-primary-foreground/60">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
