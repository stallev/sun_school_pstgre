"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TrainerServiceForEdit } from "@/data/trainer/get-trainer-services-for-edit.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export type TrainerServiceDeleteDialogProps = {
  service: TrainerServiceForEdit | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function TrainerServiceDeleteDialog({  service,
  isPending,
  onOpenChange,
  onConfirm,
}: TrainerServiceDeleteDialogProps) {
  const messages = useMessages();

  return (
    <AlertDialog open={service !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{messages.trainer.services.deleteConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {messages.trainer.services.deleteConfirmDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {messages.trainer.services.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            aria-busy={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {messages.trainer.services.deleteConfirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
