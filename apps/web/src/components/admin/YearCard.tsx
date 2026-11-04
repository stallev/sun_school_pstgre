"use client";

import { useActionState, useState } from "react";
import { ACADEMIC_YEAR_STATUS, type MutationResult } from "@sunschool/domain";
import { activateYearAction, closeYearAction } from "@/actions/school-year";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ContentText, SectionTitle } from "@/components/atoms";
import { StatusText } from "@/components/ui/status-text";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AcademicYearListRow } from "@/data/school/load-academic-years-list.server";
import { formatAcademicYearStatusLabel } from "@/lib/admin/format-academic-year-status-label";
import { resolveYearCardSummaryLine } from "@/lib/admin/format-year-summary-line";
import { formatDate } from "@/lib/i18n/format";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

type YearCardProps = {
  row: AcademicYearListRow;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  uiLocale: MessageLocale;
};

export const YearCard = ({ row, dictionaries, formError, uiLocale }: YearCardProps) => {
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
  const summaryLine = resolveYearCardSummaryLine({
    locale: uiLocale,
    template: messages.year.summaryTemplate,
    lessonCount: row.lessonCount,
    groupCount: row.groupCount,
    pupilCount: row.pupilCount,
    lessonForms: messages.year.summaryLessons,
    groupForms: messages.year.summaryGroups,
    pupilForms: messages.year.summaryPupils,
    status: row.status,
    archiveSummary: messages.year.archiveSummary,
  });

  return (
    <article className="flex h-full flex-col space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle>{row.name}</SectionTitle>
        <StatusText tone="neutral" className="shrink-0 text-sm">
          {statusLabel}
        </StatusText>
      </div>
      <ContentText tone="muted" className="text-sm">
        {formatDate(row.startsOn, uiLocale)} — {formatDate(row.endsOn, uiLocale)}
      </ContentText>
      <ContentText className="text-sm text-ink-2">{summaryLine}</ContentText>
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
        <section className="mt-auto space-y-3 border-t border-line pt-4">
          <SectionTitle>{messages.year.dangerZoneTitle}</SectionTitle>
          <ContentText className="text-sm text-ink-2">{messages.year.dangerZoneCloseLead}</ContentText>
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
                const form = document.getElementById(`close-year-${row.yearId}`) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            />
          </form>
        </section>
      ) : null}
    </article>
  );
};
