import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CustomLinkProps = ComponentProps<typeof Link> & {
  /** `action` — standalone link outside running text: hit area ≥ 36 px (ADR-022 §4.3). */
  variant?: "inline" | "action";
};

/** Inline navigation link: `cobalt-ink` (never `cobalt` as text colour — UX-03 §5). */
export const CustomLink = ({ className, variant = "inline", ...props }: CustomLinkProps) => (
  <Link
    className={cn(
      "rounded-sm font-medium text-cobalt-ink",
      variant === "action" && "inline-flex min-h-8 items-center py-1",
      className,
    )}
    {...props}
  />
);
