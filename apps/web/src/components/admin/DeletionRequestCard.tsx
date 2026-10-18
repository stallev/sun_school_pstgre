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
import { countDeletionPlanTotals, type DeletionAdminRow } from "@/data/deletions/load-deletion-admin-list.server";
import { formatDeletionDays, type AdminMessages } from "@/lib/messages/admin-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type DeletionRequestCardProps = {
  row: DeletionAdminRow;
  messages: AdminMessages;
  locale: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const DeletionRequestCard = ({
  row,
  messages,
  locale,
  dictionaries,
  formError,
  closeLabel,
}: DeletionRequestCardProps) => {
  const d = messages.deletions;
  const dateFmt = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium" });
  const requestedDate = dateFmt.format(new Date(row.requestedAtIso));
  const typeLabel = row.type === DELETION_REQUEST_TYPE.ACCOUNT ? d.typeAccount : d.typeChild;
  const statusLabel = statusLabelFor(row.status, d);
  const isOpen =
    row.status === DELETION_REQUEST_STATUS.NEW || row.status === DELETION_REQUEST_STATUS.IN_PROGRESS;
  const totals = countDeletionPlanTotals(row.plan);
  const executeDisabled =
    row.executeBlocked || row.status === DELETION_REQUEST_STATUS.NEW;

  const requestedByLine = row.requestedBySelf
    ? d.requestedBySelf
    : d.requestedBy.replace("{name}", row.requestedByDisplayName);

  return (
    <li className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <ContentText tone="muted" className="text-sm">
            {typeLabel} · {d.requestedOn.replace("{date}", requestedDate)}
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
            <ContentText
              className={`text-sm tabular-nums ${row.isOverdue ? "font-bold text-danger" : "text-ink-2"}`}
            >
              {row.isOverdue
                ? formatDeletionDays(d.daysOverdue, row.daysRemaining)
                : formatDeletionDays(d.daysLeft, row.daysRemaining)}
            </ContentText>
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
            <DeletionPlanView plan={row.plan} messages={d} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
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
        </>
      ) : (
        <ContentText tone="secondary" className="mt-3 text-sm">
          {closedSummary(row, d, dateFmt)}
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
  dateFmt: Intl.DateTimeFormat,
): string => {
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
