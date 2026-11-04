"use client";

import { useState, type ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { PupilCardForm } from "@/components/admin/PupilCardForm";
import { PupilRowActions } from "@/components/admin/PupilRowActions.client";
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
  const consentLabel = row.hasEnrollableConsent
    ? row.consentPaperActive
      ? messages.people.consentPaper
      : messages.people.consentLegacy
    : messages.people.consentMissing;

  const meta = formatPupilMeta(messages, row);

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <ContentText className="font-medium text-ink hover:text-cobalt-ink">{row.displayName}</ContentText>
        <ContentText tone="secondary" className="text-sm">{meta}</ContentText>
        <StatusText tone={row.hasEnrollableConsent ? "ok" : "warn"}>{consentLabel}</StatusText>
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
