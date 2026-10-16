"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { mergeUsersAction } from "@/actions/access-admin";
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
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type MergeUsersDialogProps = {
  keepUserId: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const MergeUsersDialog = ({
  keepUserId,
  dictionaries,
  formError,
  closeLabel,
}: MergeUsersDialogProps) => {
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    mergeUsersAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.users.toastMerged,
    formErrorFallback: formError,
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        {messages.users.mergeUsers}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.users.mergeTitle}</DialogTitle>
          <DialogDescription>{messages.users.mergeDescription}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" aria-busy={pending}>
          <input type="hidden" name="keepUserId" value={keepUserId} />
          <Field>
            <FieldLabel htmlFor="mergeUserId">{messages.users.mergeRemove}</FieldLabel>
            <Input id="mergeUserId" name="mergeUserId" disabled={pending} required />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              {closeLabel}
            </DialogClose>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {messages.approvals.submitPending}
                </>
              ) : (
                messages.users.mergeUsers
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
