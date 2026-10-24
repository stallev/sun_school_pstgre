"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { executeDeletionRequestAction } from "@/actions/deletions";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { AlertText } from "@/components/atoms";
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
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type DeletionConfirmDialogProps = {
  requestId: string;
  subjectName: string;
  deleteCount: number;
  anonymizeCount: number;
  disabled?: boolean;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const DeletionConfirmDialog = ({
  requestId,
  subjectName,
  deleteCount,
  anonymizeCount,
  disabled = false,
  dictionaries,
  formError,
  closeLabel,
}: DeletionConfirmDialogProps) => {
  const messages = useAdminMessages();
  const d = messages.deletions;
  const [open, setOpen] = useState(false);
  const [confirmWord, setConfirmWord] = useState("");
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    executeDeletionRequestAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: d.toastExecuted,
    formErrorFallback: formError,
    onSuccess: () => {
      setOpen(false);
      setConfirmWord("");
    },
  });

  const summary = d.executeSummary
    .replace("{deleteCount}", String(deleteCount))
    .replace("{anonymizeCount}", String(anonymizeCount));
  const confirmLabel = d.confirmLabel.replace("{word}", d.confirmWord);
  const wordOk = confirmWord.trim().toLowerCase() === d.confirmWord.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" className="min-h-11" disabled={disabled} />
        }
      >
        {d.execute}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{d.executeTitle}</DialogTitle>
          <DialogDescription>{subjectName}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" aria-busy={pending}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="acknowledgePlan" value="true" />
          <p className="text-sm text-ink-2">{summary}</p>
          <Field>
            <FieldLabel htmlFor={`del-confirm-${requestId}`}>{confirmLabel}</FieldLabel>
            <Input
              id={`del-confirm-${requestId}`}
              name="confirmWord"
              value={confirmWord}
              onChange={(event) => setConfirmWord(event.target.value)}
              disabled={pending}
              autoComplete="off"
            />
          </Field>
          {state && !state.ok && state.fields?.confirmWord ? (
            <AlertText role="alert">{formError}</AlertText>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              {closeLabel}
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || !wordOk}
              aria-busy={pending}
              className={FORM_SUBMIT_BUTTON_CLASS}
            >
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {d.submitPending}
                </>
              ) : (
                d.executeSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
