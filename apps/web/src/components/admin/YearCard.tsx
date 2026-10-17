"use client";

import { useActionState, useState } from "react";
import { ACADEMIC_YEAR_STATUS, type MutationResult } from "@sunschool/domain";
import { activateYearAction, closeYearAction } from "@/actions/school-year";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ContentText, SectionTitle } from "@/components/atoms";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AcademicYearListRow } from "@/data/school/load-academic-years-list.server";
import { formatAcademicYearStatusLabel } from "@/lib/admin/format-academic-year-status-label";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type YearCardProps = {
  row: AcademicYearListRow;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const YearCard = ({ row, dictionaries, formError }: YearCardProps) => {
  const messages = useAdminMessages();
  const [activateState, activateAction, activatePending] = useActionState<MutationResult | null, FormData>(
    activateYearAction,
    null,
  );
  const [closeState, closeAction, closePending] = useActionState<MutationResult | null, FormData>(
    closeYearAction,
    null,
  );
  const [closeReason, setCloseReason] = useState("");

  useAdminFormMutation({
    state: activateState,
    dictionaries,
    successMessage: messages.year.toastActivated,
    formErrorFallback: formError,
  });
  useAdminFormMutation({
    state: closeState,
    dictionaries,
    successMessage: messages.year.toastClosed,
    formErrorFallback: formError,
  });

  const pending = activatePending || closePending;
  const statusLabel = formatAcademicYearStatusLabel(row.status, messages);

  return (
    <article className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <SectionTitle>{row.name}</SectionTitle>
        <ContentText tone="secondary" className="text-sm">{statusLabel}</ContentText>
      </div>
      <ContentText tone="secondary" className="text-sm">
        {row.startsOn} — {row.endsOn}
      </ContentText>
      <div className="flex flex-wrap gap-2">
        {row.status === ACADEMIC_YEAR_STATUS.DRAFT ? (
          <form action={activateAction} id={`activate-year-${row.yearId}`}>
            <input type="hidden" name="yearId" value={row.yearId} />
            <ConfirmDialog
              trigger={
                <Button type="button" variant="default" disabled={pending} aria-busy={pending}>
                  {messages.year.activate}
                </Button>
              }
              title={messages.year.activateConfirmTitle}
              description={messages.year.activateConfirmDescription}
              confirmLabel={messages.year.activate}
              cancelLabel={messages.form.cancel}
              pending={pending}
              onConfirm={() => {
                const form = document.getElementById(`activate-year-${row.yearId}`) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            />
          </form>
        ) : null}
        {row.status === ACADEMIC_YEAR_STATUS.ACTIVE ? (
          <form action={closeAction} id={`close-year-${row.yearId}`} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="yearId" value={row.yearId} />
            <label className="grid gap-1 text-sm">
              <span>{messages.year.closeReasonLabel}</span>
              <Input
                name="reason"
                value={closeReason}
                onChange={(event) => setCloseReason(event.target.value)}
                disabled={pending}
              />
            </label>
            <ConfirmDialog
              trigger={
                <Button type="button" variant="destructive-solid" disabled={pending} aria-busy={pending}>
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
                const form = document.getElementById(`close-year-${row.yearId}`) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            />
          </form>
        ) : null}
      </div>
    </article>
  );
};
