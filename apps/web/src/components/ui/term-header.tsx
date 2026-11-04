"use client";

import { TermHint } from "@/components/ui/term-hint";
import { type NonEmptyTerm } from "@/components/ui/term-label";
import { cn } from "@/lib/utils";

type TermHeaderProps = {
  term: NonEmptyTerm;
  hint: string;
  ariaLabel: string;
  className?: string;
  scope?: "col" | "row";
};

/** Table column header: visible term + «?», popover opens upward (ADR-020). */
export const TermHeader = ({
  term,
  hint,
  ariaLabel,
  className,
  scope = "col",
}: TermHeaderProps) => (
  <th scope={scope} className={cn("font-normal", className)}>
    <span className="inline-flex items-center justify-end gap-1">
      {term}
      <TermHint term={term} hint={hint} ariaLabel={ariaLabel} side="top" />
    </span>
  </th>
);
