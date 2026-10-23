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
import { Input } from "@/components/ui/input";
import type { PupilPenaltyFormData } from "@/lib/achievements/pupil-penalty-form-types";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { manualAwardSelectClass } from "@/lib/achievements/manual-award-types";
import { fillMessage } from "@/lib/messages/fill-message";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";

type IssuePenaltyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  formData: PupilPenaltyFormData;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const IssuePenaltyDialog = ({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  formData,
  messages,
  dictionaries,
  formError,
}: IssuePenaltyDialogProps) => {
  const defaultType = formData.penaltyTypes[0];
  const defaultLesson = formData.lessons[0];
  const [achievementId, setAchievementId] = useState(defaultType?.achievementId ?? "");
  const [lessonId, setLessonId] = useState(defaultLesson?.lessonId ?? "");
  const [points, setPoints] = useState(defaultType?.catalogPoints ?? 1);

  const selectedType = useMemo(
    () => formData.penaltyTypes.find((row) => row.achievementId === achievementId),
    [achievementId, formData.penaltyTypes],
  );

  const [state, formAction, pending] = useActionState<
    MutationResult<{ penaltyId: string }> | null,
    FormData
  >(issuePenaltyFormAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastPenaltyIssued,
    formErrorFallback: formError,
    onSuccess: () => onOpenChange(false),
  });

  const negativePoints = -Math.abs(points);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.closeLabel} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{messages.penaltyDialogTitle}</DialogTitle>
          <ContentText className="text-sm text-ink-2">{pupilName}</ContentText>
        </DialogHeader>
        <form action={formAction} className="grid gap-4" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          <input type="hidden" name="achievementId" value={achievementId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="points" value={negativePoints} />
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.penaltyLessonLabel}</ContentText>
            <select
              className={manualAwardSelectClass}
              value={lessonId}
              disabled={pending}
              onChange={(event) => setLessonId(event.target.value)}
            >
              {formData.lessons.map((row) => (
                <option key={row.lessonId} value={row.lessonId}>{row.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.penaltyTypeLabel}</ContentText>
            <select
              className={manualAwardSelectClass}
              value={achievementId}
              disabled={pending}
              onChange={(event) => {
                setAchievementId(event.target.value);
                const next = formData.penaltyTypes.find((row) => row.achievementId === event.target.value);
                if (next) setPoints(next.catalogPoints);
              }}
            >
              {formData.penaltyTypes.map((row) => (
                <option key={row.achievementId} value={row.achievementId}>{row.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.penaltyPointsLabel}</ContentText>
            <Input
              inputMode="numeric"
              value={points}
              disabled={pending}
              className="tabular-nums"
              onChange={(event) => setPoints(Number(event.target.value) || 0)}
            />
            {selectedType ? (
              <ContentText className="text-sm text-muted">
                {fillMessage(messages.penaltyPointsHintTemplate, {
                  catalog: selectedType.catalogPoints,
                })}
              </ContentText>
            ) : null}
          </label>
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.penaltyReasonLabel}</ContentText>
            <textarea
              name="reason"
              rows={2}
              required
              disabled={pending}
              placeholder={messages.penaltyReasonPlaceholder}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <ContentText className="text-sm text-muted">{messages.penaltyReasonHint}</ContentText>
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              {messages.cancel}
            </Button>
            <Button
              type="submit"
              className="border-penalty bg-penalty-soft text-penalty hover:bg-penalty-soft"
              disabled={pending || !lessonId || !achievementId}
              aria-busy={pending}
            >
              {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? messages.saving : messages.penaltySubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
