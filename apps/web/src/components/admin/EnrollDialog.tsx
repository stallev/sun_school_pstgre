"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { enrollPupilAction, unenrollPupilAction } from "@/actions/school-pupils";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
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
import { FormDateField } from "@/components/ui/form-date-field";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { getFormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import type { PeopleGroupOption } from "@/data/school/load-people-admin-list.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type EnrollDialogProps = {
  pupilId: string;
  displayName: string;
  mode: "enroll" | "unenroll";
  groups: readonly PeopleGroupOption[];
  defaultDate: string;
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
  closeLabel: string;
};

export const EnrollDialog = ({
  pupilId,
  displayName,
  mode,
  groups,
  defaultDate,
  dictionaries,
  uiLocale,
  formError,
  closeLabel,
}: EnrollDialogProps) => {
  const dateFieldCopy = getFormDateFieldCopy(dictionaries.common!, uiLocale);
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);
  const action = mode === "enroll" ? enrollPupilAction : unenrollPupilAction;
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(action, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage:
      mode === "enroll" ? messages.people.toastEnrolled : messages.people.toastUnenrolled,
    formErrorFallback: formError,
    onSuccess: () => setOpen(false),
  });

  const triggerLabel = mode === "enroll" ? messages.people.enrollAction : messages.people.unenrollAction;
  const title = mode === "enroll" ? messages.people.enrollTitle : messages.people.unenrollTitle;
  const description =
    mode === "enroll" ? messages.people.enrollDescription : messages.people.unenrollDescription;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={mode === "unenroll" ? "outline" : "default"}
            className="min-h-11"
          />
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description} — {displayName}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          {mode === "enroll" ? (
            <label className="grid gap-1 text-sm">
              <span>{messages.people.groupLabel}</span>
              <FormSelect
                name="gradeId"
                required
                disabled={pending}
                defaultValue=""
                placeholder={messages.people.groupPlaceholder}
                options={groups
                  .filter((group) => group.isActive)
                  .map((group) => ({ value: group.gradeId, label: group.name }))}
              />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm">
            <span>{mode === "enroll" ? messages.people.startsOnLabel : messages.people.endsOnLabel}</span>
            <FormDateField
              name={mode === "enroll" ? "startsOn" : "endsOn"}
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
                triggerLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
