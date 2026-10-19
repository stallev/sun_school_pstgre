"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { extendLegacyDeadlineAction } from "@/actions/school-pupils";
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

type ExtendLegacyDeadlineDialogProps = {
  defaultNewDeadlineOn: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const ExtendLegacyDeadlineDialog = ({
  defaultNewDeadlineOn,
  dictionaries,
  formError,
  closeLabel,
}: ExtendLegacyDeadlineDialogProps) => {
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(extendLegacyDeadlineAction, null);
  const mutationState: MutationResult | null = state;

  useAdminFormMutation({
    state: mutationState,
    dictionaries,
    successMessage: messages.people.toastLegacyDeadlineExtended,
    formErrorFallback: formError,
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" className="min-h-11" />}>
        {messages.people.legacyExtendAction}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{messages.people.legacyExtendTitle}</DialogTitle>
          <DialogDescription>{messages.people.legacyExtendDescription}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-muted-foreground">{messages.people.legacyNewDeadlineLabel}</span>
            <Input name="newDeadlineOn" type="date" required defaultValue={defaultNewDeadlineOn} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-muted-foreground">{messages.people.legacyExtendReasonLabel}</span>
            <Input name="reason" required maxLength={500} />
          </label>
          <DialogFooter className="gap-2 sm:justify-end">
            <DialogClose render={<Button type="button" variant="ghost" className="min-h-11" />}>
              {closeLabel}
            </DialogClose>
            <Button type="submit" className={FORM_SUBMIT_BUTTON_CLASS} disabled={pending} aria-busy={pending}>
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {messages.people.submitPending}
                </>
              ) : (
                messages.people.legacyExtendSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
