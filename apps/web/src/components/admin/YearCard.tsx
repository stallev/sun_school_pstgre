"use client";

import { useActionState } from "react";
import { ACADEMIC_YEAR_STATUS, type MutationResult } from "@sunschool/domain";
import { activateYearAction, closeYearAction } from "@/actions/school-year";
import { YearCloseButton } from "@/components/admin/YearCloseButton";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ContentText, SectionTitle } from "@/components/atoms";
import { StatusText } from "@/components/ui/status-text";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { AcademicYearListRow } from "@/data/school/load-academic-years-list.server";
import { formatAcademicYearStatusLabel } from "@/lib/admin/format-academic-year-status-label";
import { resolveYearCardSummaryLine } from "@/lib/admin/format-year-summary-line";
import { formatDate } from "@/lib/i18n/format";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type YearCardProps = {
  row: AcademicYearListRow;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  uiLocale: MessageLocale;
  yearCloseHint: HintTerm;
  yearCloseReasonHint: HintTerm;
};

export const YearCard = ({
  row,
  dictionaries,
  formError,
  uiLocale,
  yearCloseHint,
  yearCloseReasonHint,
}: YearCardProps) => {
  const messages = useAdminMessages();
  const [activateState, activateAction, activatePending] = useActionState<MutationResult | null, FormData>(
    activateYearAction,
    null,
  );
  const [closeState, closeAction, closePending] = useActionState<MutationResult | null, FormData>(
    closeYearAction,
    null,
  );

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
    <article className="flex h-full flex-col gap-stack rounded-xl border border-line bg-surface p-card">
      <div className="flex items-start justify-between gap-stack">
        <SectionTitle>{row.name}</SectionTitle>
        <StatusText tone="neutral" className="shrink-0 text-sm">
          {statusLabel}
        </StatusText>
      </div>
      <ContentText tone="muted" className="text-sm">
        {formatDate(row.startsOn, uiLocale)} — {formatDate(row.endsOn, uiLocale)}
      </ContentText>
      <ContentText tone="secondary" className="text-sm">
        {summaryLine}
      </ContentText>
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
        <YearCloseButton
          yearId={row.yearId}
          yearName={row.name}
          pending={pending}
          closeAction={closeAction}
          closeHint={yearCloseHint}
          closeReasonHint={yearCloseReasonHint}
        />
      ) : null}
    </article>
  );
};
