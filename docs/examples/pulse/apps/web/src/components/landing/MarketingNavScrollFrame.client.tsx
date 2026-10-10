"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useLandingScrolled } from "@/lib/ui/use-landing-scrolled";

type MarketingNavScrollFrameProps = {
  navAriaLabel: string;
  children: React.ReactNode;
};

export function MarketingNavScrollFrame({
  navAriaLabel,
  children,
}: MarketingNavScrollFrameProps) {
  const pathname = usePathname();
  const scrolled = useLandingScrolled();
  const isLanding = pathname === "/";

  return (
    <nav
      aria-label={navAriaLabel}
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-4 transition-all duration-300 md:h-[72px] md:px-14",
        (scrolled || !isLanding) &&
          "border-b border-border/60 bg-background/95 shadow-[var(--shadow-card)] backdrop-blur-xl",
      )}
    >
      {children}
    </nav>
  );
}
