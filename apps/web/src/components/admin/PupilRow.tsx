"use client";

import { useState, type ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { ConsentDialog } from "@/components/admin/ConsentDialog";
import { EnrollDialog } from "@/components/admin/EnrollDialog";
import { PupilCardForm } from "@/components/admin/PupilCardForm";
import { ChildDeletionRequestDialog } from "@/components/admin/ChildDeletionRequestDialog.client";
import { TransferDialog } from "@/components/admin/TransferDialog";
import { StatusText } from "@/components/ui/status-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PeopleGroupOption, PupilListRow } from "@/data/school/load-people-admin-list.server";
import { formatPupilMeta } from "@/lib/admin/format-pupil-meta";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type PupilRowProps = {
  row: PupilListRow;
  groups: readonly PeopleGroupOption[];
  consentTextVersion: string;
  defaultDate: string;
  dictionaries: Record<string, Dictionary>;
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
    <li className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-1">
        <ContentText className="font-medium text-ink">{row.displayName}</ContentText>
        <ContentText tone="secondary" className="text-sm">{meta}</ContentText>
        <StatusText tone={row.hasEnrollableConsent ? "ok" : "warn"}>{consentLabel}</StatusText>
        {!row.isActive ? (
          <StatusText tone="neutral">{messages.people.statusInactive}</StatusText>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger render={<Button type="button" variant="ghost" className="min-h-11" />}>
            {messages.people.editAction}
          </DialogTrigger>
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
              formError={formError}
              onSuccess={() => setEditOpen(false)}
            />
            {historySlot}
          </DialogContent>
        </Dialog>
        {!row.hasEnrollableConsent ? (
          <ConsentDialog
            pupilId={row.pupilId}
            displayName={row.displayName}
            consentTextVersion={consentTextVersion}
            defaultSignedOn={defaultDate}
            dictionaries={dictionaries}
            formError={formError}
            closeLabel={closeLabel}
          />
        ) : null}
        {row.isActive && row.hasEnrollableConsent && !row.groupName ? (
          <EnrollDialog
            pupilId={row.pupilId}
            displayName={row.displayName}
            mode="enroll"
            groups={groups}
            defaultDate={defaultDate}
            dictionaries={dictionaries}
            formError={formError}
            closeLabel={closeLabel}
          />
        ) : null}
        <ChildDeletionRequestDialog
          pupilId={row.pupilId}
          displayName={row.displayName}
          dictionaries={dictionaries}
          formError={formError}
          closeLabel={closeLabel}
        />
        {row.isActive && row.groupName ? (
          <>
            <TransferDialog
              pupilId={row.pupilId}
              displayName={row.displayName}
              currentGradeId={row.gradeId}
              groups={groups}
              defaultDate={defaultDate}
              dictionaries={dictionaries}
              formError={formError}
              closeLabel={closeLabel}
            />
            <EnrollDialog
              pupilId={row.pupilId}
              displayName={row.displayName}
              mode="unenroll"
              groups={groups}
              defaultDate={defaultDate}
              dictionaries={dictionaries}
              formError={formError}
              closeLabel={closeLabel}
            />
          </>
        ) : null}
      </div>
    </li>
  );
};
