"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { awardManuallyFormAction } from "@/actions/teacher-achievements";
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
import { Label } from "@/components/ui/label";
import { isCheckLessonActiveWorkCode } from "@/lib/achievements/check-lesson-marks-helpers";
import type { CheckLessonAwardOption } from "@/lib/achievements/check-lesson-marks-types";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { fillMessage } from "@/lib/messages/fill-message";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

type CheckAwardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  lessonSubtitle: string;
  lessonId: string;
  academicYearId: string;
  lessonDateIso: string;
  lessonDateLabel: string;
  awardOptions: readonly CheckLessonAwardOption[];
  eventDate: { locale: "ru" | "en"; today: string; min: string };
  messages: TeacherCheckMessages;
  achievementMessages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const CheckAwardDialog = ({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  lessonSubtitle,
  lessonId,
  academicYearId,
  lessonDateIso,
  lessonDateLabel,
  awardOptions,
  eventDate,
  messages,
  achievementMessages,
  dictionaries,
  formError,
}: CheckAwardDialogProps) => {
  const defaultOption = awardOptions[0];
  const [selectedCode, setSelectedCode] = useState(defaultOption?.code ?? "");
  const [points, setPoints] = useState(defaultOption?.maxPoints ?? 0);
  const [eventOn, setEventOn] = useState(lessonDateIso);

  const selected = useMemo(
    () => awardOptions.find((row) => row.code === selectedCode) ?? defaultOption,
    [awardOptions, defaultOption, selectedCode],
  );

  const isActiveWork = selected ? isCheckLessonActiveWorkCode(selected.code) : false;

  const [state, formAction, pending] = useActionState<
    MutationResult<{ awardId: string }> | null,
    FormData
  >(awardManuallyFormAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: achievementMessages.toastAwardIssued,
    formErrorFallback: formError,
    onSuccess: () => onOpenChange(false),
  });

  const handleSelectCode = (code: string) => {
    setSelectedCode(code);
    const row = awardOptions.find((item) => item.code === code);
    if (row) setPoints(row.maxPoints);
    if (code !== selectedCode && !isCheckLessonActiveWorkCode(code)) {
      setEventOn(lessonDateIso);
    }
  };

  if (!selected) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={achievementMessages.closeLabel} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{messages.marksAwardDialogTitle}</DialogTitle>
          <ContentText className="text-sm text-ink-2">
            {pupilName} · {lessonSubtitle}
          </ContentText>
        </DialogHeader>
        <form action={formAction} className="grid gap-4" aria-busy={pending}>
          <input type="hidden" name="pupilId" value={pupilId} />
          <input type="hidden" name="achievementId" value={selected.achievementId} />
          <input type="hidden" name="tier" value={selected.tier} />
          <input type="hidden" name="academicYearId" value={academicYearId} />
          <input type="hidden" name="cacheRevalidateLessonId" value={lessonId} />
          <input type="hidden" name="eventOn" value={isActiveWork ? lessonDateIso : eventOn} />
          <ContentText className="text-sm text-ink-2">{messages.marksAwardDialogIntro}</ContentText>
          <fieldset className="grid gap-2">
            <legend className="sr-only">{messages.marksAwardDialogTitle}</legend>
            {awardOptions.map((row) => (
              <label
                key={row.code}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 has-checked:border-cobalt-ink has-checked:bg-cobalt-soft has-checked:font-bold has-checked:text-cobalt-ink"
              >
                <input
                  type="radio"
                  name="checkAwardCode"
                  value={row.code}
                  checked={selectedCode === row.code}
                  disabled={pending}
                  className="size-4 accent-[var(--color-cobalt-ink)]"
                  onChange={() => handleSelectCode(row.code)}
                />
                <span className="min-w-0 flex-1">{row.name}</span>
                <span className="tabular-nums">+{row.maxPoints}</span>
              </label>
            ))}
          </fieldset>
          {isActiveWork ? (
            <ContentText className="text-sm text-ink-2">
              {fillMessage(messages.marksActiveWorkLesson, { date: lessonDateLabel })}
            </ContentText>
          ) : (
            <div className="grid gap-1">
              <Label>{achievementMessages.awardEventDateLabel}</Label>
              <FormDateField
                name="eventOn"
                locale={eventDate.locale}
                value={eventOn}
                min={eventDate.min}
                max={eventDate.today}
                disabled={pending}
                calendarAriaLabel={achievementMessages.awardEventCalendarAria}
                onValueChange={setEventOn}
              />
              <ContentText tone="secondary" className="text-sm">
                {messages.marksEventDateHint}
              </ContentText>
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="check-award-points">{achievementMessages.awardPointsLabel}</Label>
            <Input
              id="check-award-points"
              name="points"
              inputMode="numeric"
              value={points}
              disabled={pending}
              className="tabular-nums sm:max-w-[8rem]"
              onChange={(event) => setPoints(Number(event.target.value) || 0)}
            />
            <ContentText tone="secondary" className="text-sm">
              {fillMessage(messages.marksAwardPointsHint, { catalog: selected.catalogPoints })}
            </ContentText>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="check-award-reason">{achievementMessages.awardReasonLabel}</Label>
            <Input
              id="check-award-reason"
              name="reason"
              disabled={pending}
              placeholder={achievementMessages.awardReasonPlaceholder}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              {achievementMessages.cancel}
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {achievementMessages.saving}
                </>
              ) : (
                messages.marksAwardSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
