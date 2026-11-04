"use client";

import { LockIcon } from "lucide-react";
import { TermHint } from "@/components/ui/term-hint";
import { fillMessage } from "@/lib/messages/fill-message";

type RatingPrivacyNoteProps = {
  badgeLabel: string;
  hint: string;
  termHintAriaLabel: string;
};

export const RatingPrivacyNote = ({ badgeLabel, hint, termHintAriaLabel }: RatingPrivacyNoteProps) => (
  <p className="mb-0 flex max-w-3xl flex-wrap items-center gap-2 text-sm text-ink-2">
    <span className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 font-medium">
      <LockIcon className="size-4 shrink-0 text-muted" aria-hidden />
      {badgeLabel}
      <TermHint
        term={badgeLabel}
        hint={hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: badgeLabel })}
      />
    </span>
  </p>
);
