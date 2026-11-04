"use client";

import { useState } from "react";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ContentText, SectionTitle } from "@/components/atoms";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type YearCloseButtonProps = {
  yearId: string;
  pending: boolean;
  closeAction: (payload: FormData) => void;
  closeHint: HintTerm;
  closeReasonHint: HintTerm;
};

export const YearCloseButton = ({
  yearId,
  pending,
  closeAction,
  closeHint,
  closeReasonHint,
}: YearCloseButtonProps) => {
  const messages = useAdminMessages();
  const [closeReason, setCloseReason] = useState("");

  return (
    <section className="mt-auto space-y-3 border-t border-line pt-4">
      <SectionTitle>{messages.year.dangerZoneTitle}</SectionTitle>
      <ContentText className="text-sm text-ink-2">{messages.year.dangerZoneCloseLead}</ContentText>
      <form action={closeAction} id={`close-year-${yearId}`} className="space-y-3">
        <input type="hidden" name="yearId" value={yearId} />
        <label className="grid gap-1 text-sm">
          <TermLabel
            term={nonEmptyTerm(closeReasonHint.term)}
            hint={closeReasonHint.hint}
            ariaLabel={closeReasonHint.term}
          />
          <Input
            name="reason"
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            disabled={pending}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <TermLabel
            term={nonEmptyTerm(closeHint.term)}
            hint={closeHint.hint}
            ariaLabel={closeHint.term}
          />
          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive" disabled={pending} aria-busy={pending}>
                {messages.year.close}
              </Button>
            }
            title={messages.year.closeConfirmTitle}
            description={messages.year.closeConfirmDescription}
            confirmLabel={messages.year.close}
            cancelLabel={messages.form.cancel}
            pending={pending}
            destructive
            onConfirm={() => {
              const form = document.getElementById(`close-year-${yearId}`) as HTMLFormElement | null;
              form?.requestSubmit();
            }}
          />
        </div>
      </form>
    </section>
  );
};
