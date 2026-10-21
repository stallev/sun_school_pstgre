"use client";

import type { LessonKind, LessonVerseToRecite } from "@sunschool/domain";
import { LESSON_KIND } from "@sunschool/domain";
import { AlertText, ContentText } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { CheckScoresSection } from "@/components/teacher/CheckScoresSection";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import type { SequentialCheckPupil } from "@/data/checks/sequential-check-types";

export type CheckFormState = SequentialCheckPupil & {
  presentChoice: boolean | null;
};

type CheckCardProps = {
  pupil: CheckFormState;
  lessonKind: LessonKind;
  hasTest: boolean;
  versesToRecite: readonly LessonVerseToRecite[];
  previousLessonOrdinal: number | null;
  isCorrection: boolean;
  reason: string;
  presentError?: string;
  disabled: boolean;
  messages: TeacherCheckMessages;
  onPresentChange: (value: boolean) => void;
  onSingingChange: (value: boolean) => void;
  onVerseScoreChange: (lessonVerseId: string, value: number | null) => void;
  onTestScoreChange: (value: number | null) => void;
  onNotebookScoreChange: (value: number | null) => void;
  onCommentChange: (value: string) => void;
  onReasonChange: (value: string) => void;
};

export const CheckCard = ({
  pupil,
  lessonKind,
  hasTest,
  versesToRecite,
  previousLessonOrdinal,
  isCorrection,
  reason,
  presentError,
  disabled,
  messages,
  onPresentChange,
  onSingingChange,
  onVerseScoreChange,
  onTestScoreChange,
  onNotebookScoreChange,
  onCommentChange,
  onReasonChange,
}: CheckCardProps) => {
  const isReview = lessonKind === LESSON_KIND.REVIEW;
  const presentValue = pupil.presentChoice === null ? null : pupil.presentChoice ? "yes" : "no";
  const commentId = `check-comment-${pupil.pupilId}`;

  return (
    <div className="divide-y divide-line">
      <div className="space-y-2 py-3">
        <ContentText className="font-medium text-ink">{messages.presentLabel}</ContentText>
        <SegmentedControl
          aria-label={messages.presentLabel}
          className="grid w-full grid-cols-2"
          options={[
            { value: "yes", label: messages.presentYes },
            { value: "no", label: messages.presentNo },
          ]}
          value={presentValue}
          onValueChange={(next) => onPresentChange(next === "yes")}
          disabled={disabled}
          invalid={Boolean(presentError)}
        />
        {presentError ? <AlertText>{presentError}</AlertText> : null}
        <ContentText tone="secondary" className="text-xs">{messages.presentHint}</ContentText>
      </div>
      <div className="flex flex-wrap items-center gap-3 py-3">
        <ContentText className="font-medium text-ink">{messages.singingLabel}</ContentText>
        <Switch
          checked={pupil.singing}
          onCheckedChange={onSingingChange}
          disabled={disabled}
          aria-label={messages.singingLabel}
        />
        {isReview ? (
          <ContentText tone="secondary" className="text-sm">{messages.reviewHint}</ContentText>
        ) : null}
      </div>
      <CheckScoresSection
        pupil={pupil}
        lessonKind={lessonKind}
        hasTest={hasTest}
        versesToRecite={versesToRecite}
        previousLessonOrdinal={previousLessonOrdinal}
        disabled={disabled}
        messages={messages}
        onVerseScoreChange={onVerseScoreChange}
        onTestScoreChange={onTestScoreChange}
        onNotebookScoreChange={onNotebookScoreChange}
      />
      <div className="space-y-1 py-3">
        <Label htmlFor={commentId}>{messages.commentLabel}</Label>
        <Input
          id={commentId}
          value={pupil.comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder={messages.commentPlaceholder}
          disabled={disabled}
          maxLength={500}
        />
      </div>
      {isCorrection ? (
        <div className="flex flex-wrap items-center gap-2 py-3">
          <ContentText className="text-sm font-medium">{messages.reasonLabel}</ContentText>
          {[messages.reasonLate, messages.reasonInputError, messages.reasonOther].map((chip) => (
            <button
              key={chip}
              type="button"
              aria-pressed={reason === chip}
              disabled={disabled}
              onClick={() => onReasonChange(chip)}
              className={`h-9 rounded-lg border px-2.5 text-sm ${
                reason === chip
                  ? "border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink"
                  : "border-line bg-surface text-ink-2 hover:bg-paper"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
