"use client";

import { useState, type ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { PupilCardForm } from "@/components/admin/PupilCardForm";
import { PupilRowActions } from "@/components/admin/PupilRowActions.client";
import { Badge } from "@/components/ui/badge";
import { StatusText } from "@/components/ui/status-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PeopleGroupOption, PupilListRow } from "@/data/school/load-people-admin-list.server";
import { formatPupilMeta } from "@/lib/admin/format-pupil-meta";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type PupilRowProps = {
  row: PupilListRow;
  groups: readonly PeopleGroupOption[];
  consentTextVersion: string;
  defaultDate: string;
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
  closeLabel: string;
  messages: AdminMessages;
  historySlot?: ReactNode;
};

const shouldShowConsentStatus = (row: PupilListRow): boolean =>
  !row.hasEnrollableConsent || (row.hasEnrollableConsent && !row.consentPaperActive);

export const PupilRow = ({
  row,
  groups,
  consentTextVersion,
  defaultDate,
  dictionaries,
  uiLocale,
  formError,
  closeLabel,
  messages,
  historySlot,
}: PupilRowProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const consentLabel = !row.hasEnrollableConsent
    ? messages.people.consentMissing
    : messages.people.consentLegacy;

  const meta = formatPupilMeta(messages, row);

  return (
    <li className="flex flex-col gap-stack px-card py-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-hint">
        <div className="flex flex-wrap items-center gap-chip">
          <ContentText className="font-medium text-ink hover:text-cobalt-ink">{row.displayName}</ContentText>
          {row.groupName ? <Badge variant="outline">{row.groupName}</Badge> : null}
        </div>
        <ContentText tone="secondary" className="text-sm">{meta}</ContentText>
        {shouldShowConsentStatus(row) ? (
          <StatusText tone={row.hasEnrollableConsent ? "warn" : "warn"}>{consentLabel}</StatusText>
        ) : null}
        {!row.isActive ? (
          <StatusText tone="neutral">{messages.people.statusInactive}</StatusText>
        ) : null}
      </div>
      <PupilRowActions
        row={row}
        groups={groups}
        consentTextVersion={consentTextVersion}
        defaultDate={defaultDate}
        dictionaries={dictionaries}
        uiLocale={uiLocale}
        formError={formError}
        closeLabel={closeLabel}
        onEdit={() => setEditOpen(true)}
      />
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{messages.people.editTitle}</DialogTitle>
          </DialogHeader>
          <PupilCardForm
            mode="edit"
            pupilId={row.pupilId}
            initial={{
              lastName: row.lastName,
              firstName: row.firstName,
              middleName: row.middleName,
              birthDate: row.birthDateIso ?? "",
              isActive: row.isActive,
            }}
            dictionaries={dictionaries}
            uiLocale={uiLocale}
            formError={formError}
            onSuccess={() => setEditOpen(false)}
          />
          {historySlot}
        </DialogContent>
      </Dialog>
    </li>
  );
};
