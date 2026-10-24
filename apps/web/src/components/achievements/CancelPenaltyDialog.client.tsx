"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { cancelPenaltyFormAction } from "@/actions/teacher-achievements";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";

type CancelPenaltyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penaltyId: string;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const CancelPenaltyDialog = ({
  open,
  onOpenChange,
  penaltyId,
  messages,
  dictionaries,
  formError,
}: CancelPenaltyDialogProps) => {
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState<
    MutationResult<{ penaltyId: string }> | null,
    FormData
  >(cancelPenaltyFormAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastPenaltyCancelled,
    formErrorFallback: formError,
    onSuccess: () => onOpenChange(false),
  });

  const applyPreset = (preset: string) => setReason(preset);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.closeLabel}>
        <DialogHeader>
          <DialogTitle>{messages.penaltyOffDialogTitle}</DialogTitle>
          <ContentText className="text-sm text-ink-2">{messages.penaltyOffIntro}</ContentText>
        </DialogHeader>
        <form action={formAction} className="grid gap-4" aria-busy={pending}>
          <input type="hidden" name="penaltyId" value={penaltyId} />
          <div className="flex flex-wrap gap-2">
            {[messages.penaltyOffReasonPreset1, messages.penaltyOffReasonPreset2, messages.penaltyOffReasonPreset3].map(
              (preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="compact"
                  variant="outline"
                  disabled={pending}
                  onClick={() => applyPreset(preset)}
                >
                  {preset}
                </Button>
              ),
            )}
          </div>
          <label className="grid gap-1">
            <Input
              name="reason"
              value={reason}
              required
              disabled={pending}
              placeholder={messages.penaltyOffReasonPlaceholder}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={pending || !reason.trim()} aria-busy={pending}>
              {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? messages.saving : messages.penaltyOffSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
