"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { compensateBricksFormAction } from "@/actions/bricks";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormDateField } from "@/components/ui/form-date-field";
import { Input } from "@/components/ui/input";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { getFormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type CompensateBricksDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  yearId: string;
  issued: number;
  defaultDate: string;
  requestId: string;
  messages: TeacherBricksMessages;
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
};

export const CompensateBricksDialog = ({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  yearId,
  issued,
  defaultDate,
  requestId,
  messages,
  dictionaries,
  uiLocale,
  formError,
}: CompensateBricksDialogProps) => {
  const dateFieldCopy = getFormDateFieldCopy(dictionaries.common!, uiLocale);
  const [state, formAction, pending] = useActionState<
    MutationResult<{ ledgerId: string }> | null,
    FormData
  >(compensateBricksFormAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastCompensated,
    formErrorFallback: formError,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.closeLabel}>
        <DialogHeader>
          <DialogTitle>{fillMessage(messages.compensateDialogTitle, { name: pupilName })}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="pupilId" value={pupilId} />
          <input type="hidden" name="yearId" value={yearId} />
          <input type="hidden" name="requestId" value={requestId} />
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.quantityLabel}</ContentText>
            <Input
              name="quantity"
              type="number"
              min={1}
              max={issued > 0 ? issued : undefined}
              required
              inputMode="numeric"
            />
          </label>
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.dateLabel}</ContentText>
            <FormDateField
              name="issuedOn"
              defaultValue={defaultDate}
              locale={dateFieldCopy.locale}
              calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
              className="max-w-none"
            />
          </label>
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.noteLabel}</ContentText>
            <Input name="note" maxLength={300} required />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={pending || issued <= 0} aria-busy={pending}>
              {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? messages.saving : messages.submitCompensate}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
