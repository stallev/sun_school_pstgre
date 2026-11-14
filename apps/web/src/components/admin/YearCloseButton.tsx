"use client";

import { useState } from "react";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ContentText, SectionTitle } from "@/components/atoms";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { fillMessage } from "@/lib/messages/fill-message";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type YearCloseButtonProps = {
  yearId: string;
  yearName: string;
  pending: boolean;
  closeAction: (payload: FormData) => void;
  closeHint: HintTerm;
  closeReasonHint: HintTerm;
};

export const YearCloseButton = ({
  yearId,
  yearName,
  pending,
  closeAction,
  closeHint,
  closeReasonHint,
}: YearCloseButtonProps) => {
  const messages = useAdminMessages();
  const [closeReason, setCloseReason] = useState("");
  const period = yearName.trim();
  const closeLabel =
    period.length > 0 ? fillMessage(messages.year.closeNamed, { period }) : messages.year.close;

  const confirmPhrase = closeLabel.toLocaleLowerCase();

  return (
    <section className="mt-auto flex flex-col gap-stack border-t border-line pt-card">
      <SectionTitle>
        <TermLabel
          term={nonEmptyTerm(messages.year.dangerZoneTitle)}
          hint={closeHint.hint}
          ariaLabel={closeHint.term}
        />
      </SectionTitle>
      <div className="flex flex-col gap-hint text-sm text-ink-2">
        <ContentText className="font-medium text-ink">{messages.year.closeWillHappenTitle}</ContentText>
        <ul className="list-inside list-disc space-y-hint">
          {messages.year.closeWillHappenItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ContentText className="font-bold text-danger">{messages.year.dangerZoneCloseLead}</ContentText>
      </div>
      <form action={closeAction} id={`close-year-${yearId}`} className="flex flex-col gap-stack">
        <input type="hidden" name="yearId" value={yearId} />
        <label className="grid gap-label text-sm">
          <TermLabel
            term={nonEmptyTerm(closeReasonHint.term)}
            hint={closeReasonHint.hint}
            ariaLabel={closeReasonHint.term}
            className="w-fit"
          />
          <Input
            name="reason"
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            disabled={pending}
          />
        </label>
        <ConfirmDialog
          trigger={
            <Button type="button" variant="destructive" disabled={pending} aria-busy={pending}>
              {closeLabel}
            </Button>
          }
          title={messages.year.closeConfirmTitle}
          description={messages.year.closeConfirmDescription}
          confirmLabel={closeLabel}
          cancelLabel={messages.form.cancel}
          pending={pending}
          destructive
          confirmPhrase={confirmPhrase}
          confirmPhraseLabel={fillMessage(messages.year.closeConfirmTypeLabel, { phrase: confirmPhrase })}
          onConfirm={() => {
            const form = document.getElementById(`close-year-${yearId}`) as HTMLFormElement | null;
            form?.requestSubmit();
          }}
        />
      </form>
    </section>
  );
};
