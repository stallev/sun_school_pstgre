"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { updatePupilBirthDateAction } from "@/actions/school-pupils";
import { AlertText } from "@/components/atoms/AlertText";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormDateField } from "@/components/ui/form-date-field";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { FormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { TeacherRosterMessages } from "@/lib/messages/teacher-messages";

type PupilBirthDateDialogProps = {
  pupilId: string;
  birthDateIso: string | null;
  canEdit: boolean;
  maxDateIso: string;
  dateFieldCopy: FormDateFieldCopy;
  closeLabel: string;
  messages: TeacherRosterMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const PupilBirthDateDialog = ({
  pupilId,
  birthDateIso,
  canEdit,
  maxDateIso,
  dateFieldCopy,
  closeLabel,
  messages,
  dictionaries,
  formError,
}: PupilBirthDateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [birthDate, setBirthDate] = useState(birthDateIso ?? "");
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    updatePupilBirthDateAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.birthDateToastSaved,
    formErrorFallback: formError,
    onSuccess: () => setOpen(false),
  });

  if (!canEdit) return null;

  const fieldErrorKey = state && !state.ok ? state.fields?.birthDate : undefined;
  const fieldError = fieldErrorKey ? resolveMessageKey(dictionaries, fieldErrorKey) : null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) setBirthDate(birthDateIso ?? "");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" className="min-h-11 shrink-0" />}>
        {messages.birthDateButton}
      </DialogTrigger>
      <DialogContent closeLabel={closeLabel} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{messages.birthDateDialogTitle}</DialogTitle>
          <DialogDescription>{messages.birthDateDialogDescription}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          <label className="grid gap-1 text-sm">
            <span>{messages.birthDateLabel}</span>
            <FormDateField
              name="birthDate"
              value={birthDate}
              onValueChange={setBirthDate}
              max={maxDateIso}
              disabled={pending}
              invalid={Boolean(fieldError)}
              locale={dateFieldCopy.locale}
              calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
            />
            {fieldError ? <AlertText>{fieldError}</AlertText> : null}
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending || !birthDate} aria-busy={pending}>
              {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? messages.birthDateSaving : messages.birthDateSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
