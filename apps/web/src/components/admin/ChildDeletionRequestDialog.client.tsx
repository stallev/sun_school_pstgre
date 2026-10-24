"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { createChildDeletionRequestAction } from "@/actions/deletions";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type ChildDeletionRequestDialogProps = {
  pupilId: string;
  displayName: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const ChildDeletionRequestDialog = ({
  pupilId,
  displayName,
  dictionaries,
  formError,
  closeLabel,
}: ChildDeletionRequestDialogProps) => {
  const messages = useAdminMessages();
  const d = messages.deletions;
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, formAction, pending] = useActionState<
    MutationResult<{ requestId: string }> | null,
    FormData
  >(createChildDeletionRequestAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: d.toastChildCreated,
    formErrorFallback: formError,
    onSuccess: () => {
      setOpen(false);
      setNote("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="destructive" className="min-h-11" />}>
        {d.childRequestAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{d.childRequestTitle}</DialogTitle>
          <DialogDescription>{d.childRequestDescription} — {displayName}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          <Field>
            <FieldLabel htmlFor={`child-del-${pupilId}`}>{d.guardianNoteLabel}</FieldLabel>
            <Textarea
              id={`child-del-${pupilId}`}
              name="guardianNote"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={pending}
              required
              rows={3}
            />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              {closeLabel}
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || note.trim().length === 0}
              aria-busy={pending}
              className={FORM_SUBMIT_BUTTON_CLASS}
            >
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {d.submitPending}
                </>
              ) : (
                d.childRequestSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
