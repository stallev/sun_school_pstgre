"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { issuePenaltyFormAction } from "@/actions/teacher-achievements";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PenaltyTypeOption } from "@/lib/achievements/pupil-penalty-form-types";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { fillMessage } from "@/lib/messages/fill-message";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

type CheckPenaltyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  lessonSubtitle: string;
  lessonId: string;
  penaltyTypes: readonly PenaltyTypeOption[];
  messages: TeacherCheckMessages;
  achievementMessages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const CheckPenaltyDialog = ({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  lessonSubtitle,
  lessonId,
  penaltyTypes,
  messages,
  achievementMessages,
  dictionaries,
  formError,
}: CheckPenaltyDialogProps) => {
  const defaultType = penaltyTypes[0];
  const [achievementId, setAchievementId] = useState(defaultType?.achievementId ?? "");
  const [points, setPoints] = useState(defaultType?.catalogPoints ?? 1);

  const selectedType = useMemo(
    () => penaltyTypes.find((row) => row.achievementId === achievementId),
    [achievementId, penaltyTypes],
  );

  const [state, formAction, pending] = useActionState<
    MutationResult<{ penaltyId: string }> | null,
    FormData
  >(issuePenaltyFormAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: achievementMessages.toastPenaltyIssued,
    formErrorFallback: formError,
    onSuccess: () => onOpenChange(false),
  });

  if (penaltyTypes.length === 0) return null;

  const negativePoints = -Math.abs(points);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={achievementMessages.closeLabel} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{messages.marksPenaltyDialogTitle}</DialogTitle>
          <ContentText className="text-sm text-ink-2">
            {pupilName} · {lessonSubtitle}
          </ContentText>
        </DialogHeader>
        <form action={formAction} className="grid gap-4" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          <input type="hidden" name="achievementId" value={achievementId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="points" value={negativePoints} />
          <ContentText className="text-sm text-ink-2">{messages.marksPenaltyDialogIntro}</ContentText>
          <div className="grid gap-1">
            <Label>{achievementMessages.penaltyTypeLabel}</Label>
            <FormSelect
              value={achievementId}
              disabled={pending}
              options={penaltyTypes.map((row) => ({ value: row.achievementId, label: row.label }))}
              onValueChange={(nextId) => {
                setAchievementId(nextId);
                const next = penaltyTypes.find((row) => row.achievementId === nextId);
                if (next) setPoints(next.catalogPoints);
              }}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="check-penalty-points">{achievementMessages.penaltyPointsLabel}</Label>
            <Input
              id="check-penalty-points"
              inputMode="numeric"
              value={points}
              disabled={pending}
              className="tabular-nums sm:max-w-[8rem]"
              onChange={(event) => setPoints(Number(event.target.value) || 0)}
            />
            {selectedType ? (
              <ContentText tone="secondary" className="text-sm">
                {fillMessage(achievementMessages.penaltyPointsHintTemplate, {
                  catalog: selectedType.catalogPoints,
                })}
              </ContentText>
            ) : null}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="check-penalty-reason">{achievementMessages.penaltyReasonLabel}</Label>
            <Input
              id="check-penalty-reason"
              name="reason"
              disabled={pending}
              placeholder={achievementMessages.penaltyReasonPlaceholder}
            />
            <ContentText tone="secondary" className="text-sm">
              {achievementMessages.penaltyReasonHint}
            </ContentText>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              {achievementMessages.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={pending} aria-busy={pending}>
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {achievementMessages.saving}
                </>
              ) : (
                achievementMessages.penaltySubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
