"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { ADULT_RELATION, type MutationOk, type MutationResult } from "@sunschool/domain";
import { createFamilyWithAdultAction } from "@/actions/families";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { useMutationResultEffect } from "@/lib/ui/use-mutation-result-effects";
import type { FamilyAdminMessages } from "@/lib/messages/pick-family-admin-messages.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
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
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";
import { useRouter } from "next/navigation";

type FamilyCreateDialogProps = {
  messages: FamilyAdminMessages;
  dictionaries: Record<string, Dictionary>;
};

export const FamilyCreateDialog = ({ messages, dictionaries }: FamilyCreateDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    MutationResult<{ familyId: string; adultId: string }> | null,
    FormData
  >(createFamilyWithAdultAction, null);

  useMutationResultEffect(state, (result) => {
    if (result.ok) {
      const { familyId } = (result as MutationOk<{ familyId: string; adultId: string }>).data;
      toast.success(messages.toastCreated, { duration: PRODUCT_TOAST_DURATION_MS });
      setOpen(false);
      router.push(`/family?id=${familyId}`);
      router.refresh();
      return;
    }
    const message = result.message
      ? resolveMessageKey(dictionaries, result.message)
      : messages.formError;
    toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" className="min-h-11" />}>
        {messages.createAction}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{messages.dialogFamilyCreate}</DialogTitle>
          <DialogDescription>{messages.dialogFamilyCreateHint}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="mt-5 space-y-4" aria-busy={pending}>
          <input type="hidden" name="relation" value={ADULT_RELATION.GUARDIAN} />
          <label className="grid gap-1 text-sm">
            <span>{messages.fieldName}</span>
            <Input name="familyName" required disabled={pending} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>
              {messages.fieldAddress}{" "}
              <span className="font-normal text-muted-foreground">— {messages.fieldAddressOptional}</span>
            </span>
            <Input name="address" disabled={pending} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>
              {messages.fieldNote}{" "}
              <span className="font-normal text-muted-foreground">— {messages.fieldNoteHint}</span>
            </span>
            <Input name="note" disabled={pending} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm sm:col-span-1">
              <span>{messages.lastName}</span>
              <Input name="lastName" required disabled={pending} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-1">
              <span>{messages.firstName}</span>
              <Input name="firstName" required disabled={pending} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-1">
              <span>{messages.middleName}</span>
              <Input name="middleName" disabled={pending} />
            </label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              {messages.cancelLabel}
            </DialogClose>
            <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {messages.submitPending}
                </>
              ) : (
                messages.createSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
