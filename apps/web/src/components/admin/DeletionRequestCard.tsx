import {
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
} from "@sunschool/domain";
import { ContentText, Heading } from "@/components/atoms";
import { DeletionConfirmDialog } from "@/components/admin/DeletionConfirmDialog.client";
import { DeletionPlanView } from "@/components/admin/DeletionPlanView";
import { DeletionRejectDialog } from "@/components/admin/DeletionRejectDialog.client";
import { DeletionTakeButton } from "@/components/admin/DeletionTakeButton.client";
import { StatusText } from "@/components/ui/status-text";
import { CustomLink } from "@/components/ui/custom-link";
import { nonEmptyTerm } from "@/components/ui/non-empty-term";
import { TermLabel } from "@/components/ui/term-label";
import { countDeletionPlanTotals, type DeletionAdminRow } from "@/data/deletions/load-deletion-admin-list.server";
import { formatDeletionRequestedByLine } from "@/lib/deletions/format-deletion-requested-by-line";
import { formatRelativeCalendarDay } from "@/lib/i18n/relative-day";
import { formatDeletionDays, type AdminMessages } from "@/lib/messages/admin-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

type DeletionRequestCardProps = {
  row: DeletionAdminRow;
  messages: AdminMessages;
  locale: MessageLocale;
  schoolTimeZone: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
  deletionActionHint: HintTerm;
  deletePlanHint: HintTerm;
  anonymizePlanHint: HintTerm;
};

export const DeletionRequestCard = ({
  row,
  messages,
  locale,
  schoolTimeZone,
  dictionaries,
  formError,
  closeLabel,
  deletionActionHint,
  deletePlanHint,
  anonymizePlanHint,
}: DeletionRequestCardProps) => {
  const d = messages.deletions;
  const requestedRelative = formatRelativeCalendarDay({
    instantIso: row.requestedAtIso,
    schoolTimeZone,
    locale,
    messages: {
      today: d.requestedToday,
      yesterday: d.requestedYesterday,
      onDate: d.requestedOn,
    },
  });
  const typeLabel = row.type === DELETION_REQUEST_TYPE.ACCOUNT ? d.typeAccount : d.typeChild;
  const statusLabel = statusLabelFor(row.status, d);
  const isOpen =
    row.status === DELETION_REQUEST_STATUS.NEW || row.status === DELETION_REQUEST_STATUS.IN_PROGRESS;
  const totals = countDeletionPlanTotals(row.plan);
  const executeDisabled =
    row.executeBlocked || row.status === DELETION_REQUEST_STATUS.NEW;

  const requestedByLine = row.requestedBySelf
    ? d.requestedBySelf
    : formatDeletionRequestedByLine(
        {
          requestedByDisplayName: row.requestedByDisplayName,
          requestedByRoleLabel: row.requestedByRoleLabel,
          requestedByEmail: row.requestedByEmail,
          usedNameFallback: row.requestedByUsedNameFallback,
        },
        {
          requestedBy: d.requestedBy,
          requestedByWithRole: d.requestedByWithRole,
          requestedByRoleEmail: d.requestedByRoleEmail,
        },
      );

  return (
    <li className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <ContentText tone="muted" className="text-sm">
            {typeLabel} · {requestedRelative}
          </ContentText>
          <Heading level="section" as="h2">{row.subjectDisplayName}</Heading>
          <ContentText tone="secondary" className="text-sm">
            {requestedByLine}
            {row.reason ? ` · ${d.reasonPrefix.replace("{reason}", row.reason)}` : ""}
          </ContentText>
        </div>
        <div className="text-right space-y-1">
          <StatusText tone={statusTone(row.status)}>{statusLabel}</StatusText>
          {isOpen ? (
            row.isOverdue ? (
              <div className="space-y-1">
                <StatusText tone="danger">{d.statusOverdue}</StatusText>
                <ContentText className="text-sm tabular-nums text-danger">
                  {formatDeletionDays(d.daysOverdue, row.daysRemaining)}
                </ContentText>
              </div>
            ) : (
              <ContentText className="text-sm tabular-nums text-ink-2">
                {formatDeletionDays(d.daysLeft, row.daysRemaining)}
              </ContentText>
            )
          ) : null}
          {row.takenByDisplayName ? (
            <ContentText tone="muted" className="text-xs">
              {d.takenBy.replace("{name}", row.takenByDisplayName)}
            </ContentText>
          ) : null}
        </div>
      </div>

      {isOpen && row.plan ? (
        <>
          <div className="mt-4">
            <DeletionPlanView
              plan={row.plan}
              messages={d}
              deleteHint={deletePlanHint}
              anonymizeHint={anonymizePlanHint}
            />
          </div>
          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <TermLabel
              term={nonEmptyTerm(deletionActionHint.term)}
              hint={deletionActionHint.hint}
              ariaLabel={deletionActionHint.term}
              className="text-sm text-ink-2"
              popoverSide="top"
            />
            <div className="flex flex-wrap gap-2">
              {row.status === DELETION_REQUEST_STATUS.NEW ? (
                <DeletionTakeButton requestId={row.requestId} dictionaries={dictionaries} formError={formError} />
              ) : null}
              <DeletionConfirmDialog
                requestId={row.requestId}
                subjectName={row.subjectDisplayName}
                deleteCount={totals.deleteCount}
                anonymizeCount={totals.anonymizeCount}
                disabled={executeDisabled}
                dictionaries={dictionaries}
                formError={formError}
                closeLabel={closeLabel}
              />
              <DeletionRejectDialog
                requestId={row.requestId}
                subjectName={row.subjectDisplayName}
                dictionaries={dictionaries}
                formError={formError}
                closeLabel={closeLabel}
              />
              {row.subjectUserId ? (
                <CustomLink href={`/users/${row.subjectUserId}`} className="min-h-11 sm:ml-auto">
                  {d.profileLink}
                </CustomLink>
              ) : null}
              {row.subjectPupilId ? (
                <CustomLink href="/people" className="min-h-11 sm:ml-auto">
                  {d.pupilLink}
                </CustomLink>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <ContentText tone="secondary" className="mt-3 text-sm">
          {closedSummary(row, d, locale, schoolTimeZone)}
        </ContentText>
      )}
    </li>
  );
};

const statusLabelFor = (status: DeletionAdminRow["status"], d: AdminMessages["deletions"]): string => {
  switch (status) {
    case DELETION_REQUEST_STATUS.NEW:
      return d.statusNew;
    case DELETION_REQUEST_STATUS.IN_PROGRESS:
      return d.statusInProgress;
    case DELETION_REQUEST_STATUS.DONE:
      return d.statusDone;
    case DELETION_REQUEST_STATUS.REJECTED:
      return d.statusRejected;
    default:
      return d.statusCancelled;
  }
};

const statusTone = (status: DeletionAdminRow["status"]) => {
  if (status === DELETION_REQUEST_STATUS.DONE) return "ok" as const;
  if (status === DELETION_REQUEST_STATUS.REJECTED || status === DELETION_REQUEST_STATUS.CANCELLED) {
    return "neutral" as const;
  }
  return "warn" as const;
};

const closedSummary = (
  row: DeletionAdminRow,
  d: AdminMessages["deletions"],
  locale: MessageLocale,
  schoolTimeZone: string,
): string => {
  const dateFmt = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
    dateStyle: "medium",
    timeZone: schoolTimeZone,
  });
  if (row.status === DELETION_REQUEST_STATUS.CANCELLED) return d.resolvedCancelled;
  if (row.status === DELETION_REQUEST_STATUS.REJECTED) {
    const date = row.resolvedAtIso ? dateFmt.format(new Date(row.resolvedAtIso)) : "—";
    return d.resolvedRejected
      .replace("{date}", date)
      .replace("{reason}", row.rejectReason ?? "—");
  }
  const date = row.resolvedAtIso ? dateFmt.format(new Date(row.resolvedAtIso)) : "—";
  return d.resolvedDone.replace("{date}", date);
};
