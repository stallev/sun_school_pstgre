"use client";

import type { RefObject } from "react";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type CheckUnsavedDialogProps = {
  open: boolean;
  pupilName: string;
  pending: boolean;
  messages: TeacherCheckMessages;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  finalFocus?: RefObject<HTMLElement | null>;
  onSave: () => void;
  onDiscard: () => void;
};

export const CheckUnsavedDialog = ({
  open,
  pupilName,
  pending,
  messages,
  onOpenChange,
  onOpenChangeComplete,
  finalFocus,
  onSave,
  onDiscard,
}: CheckUnsavedDialogProps) => (
  <ConfirmDialog
    variant="unsaved"
    open={open}
    onOpenChange={onOpenChange}
    onOpenChangeComplete={onOpenChangeComplete}
    finalFocus={finalFocus}
    title={messages.unsavedDialogTitle}
    description={fillMessage(messages.unsavedDialogBody, { name: pupilName })}
    saveLabel={pending ? messages.pendingSave : messages.unsavedSave}
    discardLabel={messages.unsavedDiscard}
    stayLabel={messages.unsavedStay}
    pending={pending}
    onSave={onSave}
    onDiscard={onDiscard}
  />
);
