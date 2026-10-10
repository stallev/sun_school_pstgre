import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoVariant = "dark" | "light" | "primary";
type LogoSize = "sm" | "md" | "lg";

const SIZE: Record<LogoSize, string> = {
  sm: "text-[16px]",
  md: "text-[22px]",
  lg: "text-[30px]",
};

/** Gold initial cap — dark gold on light surfaces */
const CAP: Record<LogoVariant, string> = {
  dark: "text-[hsl(var(--color-secondary))]",
  light: "text-[hsl(var(--color-secondary-light))]",
  primary: "text-[hsl(var(--color-secondary-light))]",
};

/** Wordmark body — ink on light surfaces, cream on dark/primary surfaces */
const REST: Record<LogoVariant, string> = {
  dark: "text-foreground",
  light: "text-[hsl(var(--color-bg))]",
  primary: "text-[hsl(var(--color-bg))]",
};

export type PulseLogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string;
  className?: string;
  ariaLabel?: string;
  homeAriaLabel?: string;
};

export function PulseLogo({
  variant = "dark",
  size = "md",
  href,
  className,
  ariaLabel = "Pulse",
  homeAriaLabel = "Pulse — homepage",
}: PulseLogoProps) {
  const mark = (
    <span
      className={cn(
        "font-heading tracking-[-0.02em] leading-none select-none",
        SIZE[size],
        className,
      )}
      aria-hidden={href ? true : undefined}
    >
      <span className={CAP[variant]}>P</span>
      <span className={REST[variant]}>ulse</span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={homeAriaLabel}
      >
        {mark}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center" aria-label={ariaLabel}>
      {mark}
    </span>
  );
}
