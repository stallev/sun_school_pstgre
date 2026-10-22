"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { upsertPenaltyCatalogAction } from "@/actions/achievements";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContentText } from "@/components/atoms";
import type { CatalogRowDto } from "@/lib/achievements/catalog-display";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type PenaltyCatalogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: CatalogRowDto | null;
  messages: AchievementsCatalogMessages;
  dictionaries: Record<string, Dictionary>;
};

export const PenaltyCatalogDialog = ({
  open,
  onOpenChange,
  row,
  messages,
  dictionaries,
}: PenaltyCatalogDialogProps) => {
  const [state, formAction, pending] = useActionState<
    MutationResult<{ achievementId: string }> | null,
    FormData
  >(upsertPenaltyCatalogAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastSaved,
    formErrorFallback: messages.formError,
    onSuccess: () => onOpenChange(false),
  });

  const title = row ? messages.penaltyDialogEdit : messages.penaltyDialogCreate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{messages.penaltyDialogHint}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="mt-5 space-y-4" aria-busy={pending}>
          {row ? <input type="hidden" name="achievementId" value={row.id} /> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldName}</span>
              <Input name="nameRu" required defaultValue={row?.nameRu ?? ""} disabled={pending} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldNameEn}</span>
              <Input name="nameEn" required defaultValue={row?.nameEn ?? ""} disabled={pending} />
            </label>
          </div>
          <input type="hidden" name="descriptionRu" value={row?.descriptionRu ?? ""} />
          <input type="hidden" name="descriptionEn" value={row?.descriptionEn ?? ""} />
          <label className="grid gap-1 text-sm">
            <span>{messages.fieldMaxPoints}</span>
            <Input
              name="maxPoints"
              inputMode="numeric"
              className="tabular-nums sm:w-32"
              required
              defaultValue={row?.threshold ? String(Math.abs(row.threshold)) : "3"}
              disabled={pending || row?.kindLocked}
            />
            <ContentText tone="muted" className="text-sm">
              {messages.fieldMaxPointsHint}
            </ContentText>
          </label>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              {messages.cancelLabel}
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
              {pending ? messages.submitPending : row ? messages.saveSubmit : messages.createSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
