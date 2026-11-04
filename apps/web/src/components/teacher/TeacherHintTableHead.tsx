"use client";

import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { cn } from "@/lib/utils";

type TeacherHintTableHeadProps = {
  hint: HintTerm;
  termHintAriaLabel: string;
  className?: string;
};

export const TeacherHintTableHead = ({
  hint,
  termHintAriaLabel,
  className,
}: TeacherHintTableHeadProps) => (
  <TermLabel
    className={cn("inline-flex items-center justify-end gap-1 font-normal", className)}
    term={nonEmptyTerm(hint.term)}
    hint={hint.hint}
    ariaLabel={fillMessage(termHintAriaLabel, { term: hint.term })}
    popoverSide="top"
  />
);
