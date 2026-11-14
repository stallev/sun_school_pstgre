"use client";

import { LockIcon } from "lucide-react";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { fillMessage } from "@/lib/messages/fill-message";

type RatingPrivacyNoteProps = {
  badgeLabel: string;
  hint: string;
  termHintAriaLabel: string;
};

export const RatingPrivacyNote = ({ badgeLabel, hint, termHintAriaLabel }: RatingPrivacyNoteProps) => (
  <p className="mb-0 flex max-w-3xl flex-wrap items-center gap-chip text-sm text-ink-2">
    <span className="inline-flex min-h-11 items-center gap-hint rounded-lg border border-line bg-paper px-3 font-medium">
      <LockIcon className="size-4 shrink-0 text-muted" aria-hidden />
      <TermLabel
        term={nonEmptyTerm(badgeLabel)}
        hint={hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: badgeLabel })}
      />
    </span>
  </p>
);
