"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { rejectRequestAction } from "@/actions/access-admin";
import { AlertText } from "@/components/atoms/AlertText";
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

type RejectRequestDialogProps = {
  requestId: string;
  displayName: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const RejectRequestDialog = ({
  requestId,
  displayName,
  dictionaries,
  formError,
  closeLabel,
}: RejectRequestDialogProps) => {
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    rejectRequestAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.approvals.toastRejected,
    formErrorFallback: formError,
    onSuccess: () => {
      setOpen(false);
      setReason("");
    },
  });

  const canSubmit = reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        {messages.approvals.reject}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.approvals.rejectTitle}</DialogTitle>
          <DialogDescription>
            {messages.approvals.rejectDescription} — {displayName}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" aria-busy={pending}>
          <input type="hidden" name="requestId" value={requestId} />
          <Field>
            <FieldLabel htmlFor={`reject-reason-${requestId}`}>{messages.approvals.rejectReason}</FieldLabel>
            <Textarea
              id={`reject-reason-${requestId}`}
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
              disabled={pending || !canSubmit}
              aria-busy={pending}
              className={FORM_SUBMIT_BUTTON_CLASS}
            >
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {messages.approvals.submitPending}
                </>
              ) : (
                messages.approvals.submitReject
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
