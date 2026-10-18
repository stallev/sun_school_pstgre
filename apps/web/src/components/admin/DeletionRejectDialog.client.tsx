"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { rejectDeletionRequestAction } from "@/actions/deletions";
import { AlertText } from "@/components/atoms";
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

type DeletionRejectDialogProps = {
  requestId: string;
  subjectName: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const DeletionRejectDialog = ({
  requestId,
  subjectName,
  dictionaries,
  formError,
  closeLabel,
}: DeletionRejectDialogProps) => {
  const messages = useAdminMessages();
  const d = messages.deletions;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    rejectDeletionRequestAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: d.toastRejected,
    formErrorFallback: formError,
    onSuccess: () => {
      setOpen(false);
      setReason("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" className="min-h-11" />}>
        {d.reject}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{d.rejectTitle}</DialogTitle>
          <DialogDescription>
            {d.rejectDescription} — {subjectName}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" aria-busy={pending}>
          <input type="hidden" name="requestId" value={requestId} />
          <Field>
            <FieldLabel htmlFor={`del-reject-${requestId}`}>{d.rejectReason}</FieldLabel>
            <Textarea
              id={`del-reject-${requestId}`}
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={pending}
              required
              rows={4}
            />
          </Field>
          {state && !state.ok && state.fields?.reason ? (
            <AlertText role="alert">{formError}</AlertText>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              {closeLabel}
            </DialogClose>
            <Button
              type="submit"
              variant="destructive-solid"
              disabled={pending || reason.trim().length === 0}
              aria-busy={pending}
              className={FORM_SUBMIT_BUTTON_CLASS}
            >
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {d.submitPending}
                </>
              ) : (
                d.submitReject
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
