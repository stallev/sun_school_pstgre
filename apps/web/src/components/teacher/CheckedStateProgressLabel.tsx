"use client";

import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type CheckedStateProgressLabelProps = {
  hint: HintTerm;
  countsTemplate: string;
  checked: number;
  total: number;
  termHintAriaLabel: string;
  className?: string;
};

export const CheckedStateProgressLabel = ({
  hint,
  countsTemplate,
  checked,
  total,
  termHintAriaLabel,
  className = "text-sm tabular-nums text-ink-2",
}: CheckedStateProgressLabelProps) => (
  <p className={className}>
    <span className="inline-flex flex-nowrap items-center gap-hint whitespace-nowrap">
      <TermLabel
        term={nonEmptyTerm(hint.term)}
        hint={hint.hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: hint.term })}
      />
      <span>{fillMessage(countsTemplate, { checked, total })}</span>
    </span>
  </p>
);
