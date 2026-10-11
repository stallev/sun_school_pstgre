import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Inline navigation link: `cobalt-ink` (never `cobalt` as text colour — UX-03 §5). */
export const CustomLink = ({ className, ...props }: ComponentProps<typeof Link>) => (
  <Link
    className={cn(
      "rounded-sm font-medium text-cobalt-ink underline-offset-4 hover:underline",
      className,
    )}
    {...props}
  />
);
