"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { awardManuallyFormAction } from "@/actions/teacher-achievements";
import { ManualAwardEvidencePicker } from "@/components/achievements/ManualAwardEvidencePicker.client";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ManualAwardFormData } from "@/lib/achievements/manual-award-types";
import { manualAwardSelectClass } from "@/lib/achievements/manual-award-types";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { fillMessage } from "@/lib/messages/fill-message";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
type ManualAwardDialogFormProps = {
  gradeId: string;
  academicYearId: string;
  formData: ManualAwardFormData;
  fixedPupilId?: string;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  onClose: () => void;
};

const optionKey = (achievementId: string, tier: number) => `${achievementId}:${tier}`;

export const ManualAwardDialogForm = ({
  gradeId,
  academicYearId,
  formData,
  fixedPupilId,
  messages,
  dictionaries,
  formError,
  onClose,
}: ManualAwardDialogFormProps) => {
  const [state, formAction, pending] = useActionState<
    MutationResult<{ awardId: string }> | null,
    FormData
  >(awardManuallyFormAction, null);

  const defaultPupilId = fixedPupilId ?? formData.pupils[0]?.pupilId ?? "";
  const defaultAchievement = formData.achievements[0];
  const [pupilId, setPupilId] = useState(defaultPupilId);
  const [achievementKey, setAchievementKey] = useState(
    defaultAchievement ? optionKey(defaultAchievement.achievementId, defaultAchievement.tier) : "",
  );
  const [points, setPoints] = useState(defaultAchievement?.catalogPoints ?? 0);
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set());

  const selectedAchievement = useMemo(
    () =>
      formData.achievements.find(
        (row) => optionKey(row.achievementId, row.tier) === achievementKey,
      ),
    [achievementKey, formData.achievements],
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastAwardIssued,
    formErrorFallback: formError,
    onSuccess: onClose,
  });

  const activeEvidenceNeed = selectedAchievement?.evidenceNeed ?? 0;
  const selectedCount = selectedChecks.size;
  const evidenceOk = activeEvidenceNeed === 0 || selectedCount >= activeEvidenceNeed;

  const handleAchievementChange = (nextKey: string) => {
    setAchievementKey(nextKey);
    const row = formData.achievements.find(
      (item) => optionKey(item.achievementId, item.tier) === nextKey,
    );
    if (row) setPoints(row.catalogPoints);
    setSelectedChecks(new Set());
  };

  return (
    <DialogContent closeLabel={messages.closeLabel} className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{messages.awardDialogTitle}</DialogTitle>
        <DialogDescription>{messages.awardDialogDescription}</DialogDescription>
      </DialogHeader>
      <form action={formAction} className="grid gap-4" aria-busy={pending}>
        <input type="hidden" name="academicYearId" value={academicYearId} />
        <input type="hidden" name="gradeId" value={gradeId} />
        <input type="hidden" name="pupilId" value={pupilId} />
        <input type="hidden" name="achievementId" value={selectedAchievement?.achievementId ?? ""} />
        <input type="hidden" name="tier" value={selectedAchievement?.tier ?? 1} />
        <input type="hidden" name="points" value={points} />
        {Array.from(selectedChecks).map((checkId) => (
          <input key={checkId} type="hidden" name="checkIds" value={checkId} />
        ))}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.awardPupilLabel}</ContentText>
            <select
              className={manualAwardSelectClass}
              value={pupilId}
              disabled={pending || Boolean(fixedPupilId)}
              onChange={(event) => setPupilId(event.target.value)}
            >
              {formData.pupils.map((row) => (
                <option key={row.pupilId} value={row.pupilId}>{row.displayName}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <ContentText className="text-sm font-medium text-ink">{messages.awardPointsLabel}</ContentText>
            <Input
              inputMode="numeric"
              value={points}
              disabled={pending}
              className="tabular-nums"
              onChange={(event) => setPoints(Number(event.target.value) || 0)}
            />
            {selectedAchievement ? (
              <ContentText className="text-sm text-muted">
                  {fillMessage(messages.awardPointsHintTemplate, {
                    catalog: selectedAchievement.catalogPoints,
                  })}
              </ContentText>
            ) : null}
          </label>
        </div>
        <label className="grid gap-1">
          <ContentText className="text-sm font-medium text-ink">{messages.awardAchievementLabel}</ContentText>
          <select
            className={manualAwardSelectClass}
            value={achievementKey}
            disabled={pending}
            onChange={(event) => handleAchievementChange(event.target.value)}
          >
            {formData.achievements.map((row) => (
              <option key={optionKey(row.achievementId, row.tier)} value={optionKey(row.achievementId, row.tier)}>
                {row.label}
              </option>
            ))}
          </select>
        </label>
        {selectedAchievement && activeEvidenceNeed > 0 ? (
          <ManualAwardEvidencePicker
            key={`${pupilId}-${achievementKey}`}
            pupilId={pupilId}
            achievementId={selectedAchievement.achievementId}
            tier={selectedAchievement.tier}
            academicYearId={academicYearId}
            evidenceNeed={activeEvidenceNeed}
            messages={messages}
            dictionaries={dictionaries}
            formError={formError}
            selectedChecks={selectedChecks}
            onSelectedChecksChange={setSelectedChecks}
            disabled={pending}
          />
        ) : null}
        <label className="grid gap-1">
          <ContentText className="text-sm font-medium text-ink">{messages.awardReasonLabel}</ContentText>
          <textarea
            name="reason"
            rows={2}
            required
            disabled={pending}
            placeholder={messages.awardReasonPlaceholder}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
            {messages.cancel}
          </Button>
          <Button type="submit" disabled={pending || !evidenceOk || !pupilId} aria-busy={pending}>
            {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? messages.saving : messages.awardSubmit}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
