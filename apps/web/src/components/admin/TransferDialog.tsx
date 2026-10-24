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
import { FormSelect } from "@/components/ui/form-select";
import { FormDateField } from "@/components/ui/form-date-field";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { getFormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
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
  uiLocale: MessageLocale;
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
  uiLocale,
  formError,
  closeLabel,
}: TransferDialogProps) => {
  const messages = useAdminMessages();
  const dateFieldCopy = getFormDateFieldCopy(dictionaries.common!, uiLocale);
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
            <FormSelect
              name="toGradeId"
              required
              disabled={pending}
              defaultValue=""
              placeholder={messages.people.groupPlaceholder}
              options={targetGroups.map((group) => ({ value: group.gradeId, label: group.name }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{messages.people.transferOnLabel}</span>
            <FormDateField
              name="onDate"
              disabled={pending}
              defaultValue={defaultDate}
              locale={dateFieldCopy.locale}
              calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
              className="max-w-none"
            />
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
