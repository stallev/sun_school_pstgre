"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { transferPupilAction } from "@/actions/school-pupils";
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
import type { PeopleGroupOption } from "@/data/school/load-people-admin-list.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type TransferDialogProps = {
  pupilId: string;
  displayName: string;
  currentGradeId: string | null;
  groups: readonly PeopleGroupOption[];
  defaultDate: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const TransferDialog = ({
  pupilId,
  displayName,
  currentGradeId,
  groups,
  defaultDate,
  dictionaries,
  formError,
  closeLabel,
}: TransferDialogProps) => {
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    transferPupilAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.people.toastTransferred,
    formErrorFallback: formError,
    onSuccess: () => setOpen(false),
  });

  const targetGroups = groups.filter(
    (group) => group.isActive && group.gradeId !== currentGradeId,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" className="min-h-11" />}>
        {messages.people.transferAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.people.transferTitle}</DialogTitle>
          <DialogDescription>{messages.people.transferDescription} — {displayName}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          <label className="grid gap-1 text-sm">
            <span>{messages.people.toGroupLabel}</span>
            <select
              name="toGradeId"
              required
              disabled={pending}
              className="min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>{messages.people.groupPlaceholder}</option>
              {targetGroups.map((group) => (
                <option key={group.gradeId} value={group.gradeId}>{group.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>{messages.people.transferOnLabel}</span>
            <Input name="onDate" type="date" required disabled={pending} defaultValue={defaultDate} />
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
                messages.people.transferSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
