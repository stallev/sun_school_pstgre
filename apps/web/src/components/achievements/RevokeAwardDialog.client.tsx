"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { revokeAwardFormAction } from "@/actions/teacher-achievements";
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
import { formatTierLabel } from "@/lib/achievements/format-tier-label";
import { fillMessage } from "@/lib/messages/fill-message";

type RevokeAwardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  awardId: string;
  pupilName: string;
  achievementName: string;
  tier: number;
  points: number;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const RevokeAwardDialog = ({
  open,
  onOpenChange,
  awardId,
  pupilName,
  achievementName,
  tier,
  points,
  messages,
  dictionaries,
  formError,
}: RevokeAwardDialogProps) => {
  const [state, formAction, pending] = useActionState<
    MutationResult<{ awardId: string }> | null,
    FormData
  >(revokeAwardFormAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastAwardRevoked,
    formErrorFallback: formError,
    onSuccess: () => onOpenChange(false),
  });

  const subtitle = `${pupilName} · ${achievementName} · ${formatTierLabel(tier, messages)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.closeLabel}>
        <DialogHeader>
          <DialogTitle>{messages.revokeDialogTitle}</DialogTitle>
          <ContentText className="text-sm text-ink-2">{subtitle}</ContentText>
        </DialogHeader>
        <form action={formAction} className="grid gap-4" aria-busy={pending}>
          <input type="hidden" name="awardId" value={awardId} />
          <ul className="space-y-1.5 text-sm text-ink-2">
            <li>— {fillMessage(messages.revokeBullet1Template, { points })}</li>
            <li>— {messages.revokeBullet2}</li>
            <li>— {messages.revokeBullet3}</li>
          </ul>
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.awardReasonLabel}</ContentText>
            <Input name="reason" required disabled={pending} placeholder={messages.revokeReasonPlaceholder} />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              {messages.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={pending} aria-busy={pending}>
              {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? messages.saving : messages.revokeSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
