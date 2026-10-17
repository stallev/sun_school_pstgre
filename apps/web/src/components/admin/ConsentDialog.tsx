"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { recordPaperConsentAction } from "@/actions/school-pupils";
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
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type ConsentDialogProps = {
  pupilId: string;
  displayName: string;
  consentTextVersion: string;
  defaultSignedOn: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const ConsentDialog = ({
  pupilId,
  displayName,
  consentTextVersion,
  defaultSignedOn,
  dictionaries,
  formError,
  closeLabel,
}: ConsentDialogProps) => {
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);
  const [consentState, formAction, pending] = useActionState(recordPaperConsentAction, null);
  const state: MutationResult | null = consentState;

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.people.toastConsentRecorded,
    formErrorFallback: formError,
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" className="min-h-11" />}>
        {messages.people.consentAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.people.consentTitle}</DialogTitle>
          <DialogDescription>{messages.people.consentDescription} — {displayName}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          <input type="hidden" name="textVersion" value={consentTextVersion} />
          <label className="grid gap-1 text-sm">
            <span>{messages.people.signerLabel}</span>
            <Input name="signerName" required disabled={pending} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{messages.people.signedOnLabel}</span>
            <Input name="signedOn" type="date" required disabled={pending} defaultValue={defaultSignedOn} />
          </label>
          <p className="text-sm text-muted-foreground">
            {messages.people.consentVersionLabel}: {consentTextVersion}
          </p>
          <label className="grid gap-1 text-sm">
            <span>{messages.people.storageNoteLabel}</span>
            <Input name="storageNote" disabled={pending} />
          </label>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              {closeLabel}
            </DialogClose>
            <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {messages.people.submitPending}
                </>
              ) : (
                messages.people.consentSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
