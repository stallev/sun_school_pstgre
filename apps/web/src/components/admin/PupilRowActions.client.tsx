"use client";

import { useState, type ReactNode } from "react";
import { ConsentDialog } from "@/components/admin/ConsentDialog";
import { EnrollDialog } from "@/components/admin/EnrollDialog";
import { ChildDeletionRequestDialog } from "@/components/admin/ChildDeletionRequestDialog.client";
import { TransferDialog } from "@/components/admin/TransferDialog";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RowActionsMenu, RowActionsMenuItem } from "@/components/ui/row-actions-menu";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { PeopleGroupOption, PupilListRow } from "@/data/school/load-people-admin-list.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type PupilRowActionsProps = {
  row: PupilListRow;
  groups: readonly PeopleGroupOption[];
  consentTextVersion: string;
  defaultDate: string;
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
  closeLabel: string;
  pupilTransferHint: HintTerm;
  onEdit: () => void;
};

type PrimaryKind = "enroll" | "transfer" | "edit";

const resolvePrimary = (row: PupilListRow): PrimaryKind => {
  if (row.isActive && row.hasEnrollableConsent && !row.groupName) return "enroll";
  if (row.isActive && row.groupName) return "transfer";
  return "edit";
};

export const PupilRowActions = ({
  row,
  groups,
  consentTextVersion,
  defaultDate,
  dictionaries,
  uiLocale,
  formError,
  closeLabel,
  pupilTransferHint,
  onEdit,
}: PupilRowActionsProps) => {
  const messages = useAdminMessages();
  const primary = resolvePrimary(row);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [unenrollOpen, setUnenrollOpen] = useState(false);
  const [unenrollConfirmOpen, setUnenrollConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const shared = {
    pupilId: row.pupilId,
    displayName: row.displayName,
    groups,
    defaultDate,
    dictionaries,
    uiLocale,
    formError,
    closeLabel,
    showTrigger: false as const,
  };

  const primaryButton = (label: ReactNode, onClick: () => void) => (
    <Button type="button" className="h-9" onClick={onClick}>
      {label}
    </Button>
  );

  const transferLabel = (
    <TermLabel
      term={nonEmptyTerm(pupilTransferHint.term)}
      hint={pupilTransferHint.hint}
      ariaLabel={pupilTransferHint.term}
      popoverSide="top"
    />
  );

  let primaryAction: ReactNode;
  if (primary === "enroll") {
    primaryAction = primaryButton(messages.people.enrollAction, () => setEnrollOpen(true));
  } else if (primary === "transfer") {
    primaryAction = primaryButton(transferLabel, () => setTransferOpen(true));
  } else {
    primaryAction = primaryButton(messages.people.editAction, onEdit);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {primaryAction}
      <RowActionsMenu triggerLabel={messages.people.rowActionsMenuLabel}>
        {primary !== "edit" ? (
          <RowActionsMenuItem onClick={onEdit}>{messages.people.editAction}</RowActionsMenuItem>
        ) : null}
        {!row.hasEnrollableConsent ? (
          <RowActionsMenuItem onClick={() => setConsentOpen(true)}>
            {messages.people.consentAction}
          </RowActionsMenuItem>
        ) : null}
        {primary !== "enroll" && row.isActive && row.hasEnrollableConsent && !row.groupName ? (
          <RowActionsMenuItem onClick={() => setEnrollOpen(true)}>
            {messages.people.enrollAction}
          </RowActionsMenuItem>
        ) : null}
        {primary !== "transfer" && row.isActive && row.groupName ? (
          <RowActionsMenuItem onClick={() => setTransferOpen(true)}>{transferLabel}</RowActionsMenuItem>
        ) : null}
        {row.isActive && row.groupName ? (
          <RowActionsMenuItem destructive onClick={() => setUnenrollConfirmOpen(true)}>
            {messages.people.unenrollAction}
          </RowActionsMenuItem>
        ) : null}
        <RowActionsMenuItem destructive onClick={() => setDeleteOpen(true)}>
          {messages.deletions.childRequestAction}
        </RowActionsMenuItem>
      </RowActionsMenu>
      {!row.hasEnrollableConsent ? (
        <ConsentDialog {...shared} consentTextVersion={consentTextVersion} defaultSignedOn={defaultDate} open={consentOpen} onOpenChange={setConsentOpen} />
      ) : null}
      {row.isActive && row.hasEnrollableConsent && !row.groupName ? (
        <EnrollDialog {...shared} mode="enroll" open={enrollOpen} onOpenChange={setEnrollOpen} />
      ) : null}
      {row.isActive && row.groupName ? (
        <>
          <TransferDialog {...shared} currentGradeId={row.gradeId} open={transferOpen} onOpenChange={setTransferOpen} />
          <EnrollDialog {...shared} mode="unenroll" open={unenrollOpen} onOpenChange={setUnenrollOpen} />
        </>
      ) : null}
      <ChildDeletionRequestDialog
        pupilId={row.pupilId}
        displayName={row.displayName}
        dictionaries={dictionaries}
        formError={formError}
        closeLabel={closeLabel}
        showTrigger={false}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <Dialog open={unenrollConfirmOpen} onOpenChange={setUnenrollConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.people.unenrollConfirmTitle}</DialogTitle>
            <DialogDescription>{messages.people.unenrollConfirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>{closeLabel}</DialogClose>
            <Button
              type="button"
              variant="destructive-solid"
              onClick={() => {
                setUnenrollConfirmOpen(false);
                setUnenrollOpen(true);
              }}
            >
              {messages.people.unenrollAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
