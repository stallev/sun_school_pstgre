"use client";

import { LESSON_KIND } from "@sunschool/domain";
import type { LessonKind, LessonVerseToRecite } from "@sunschool/domain";
import { AlertText } from "@/components/atoms/AlertText";
import { ContentText } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { LateBadge } from "@/components/teacher/LateBadge";
import { ScoreGroup } from "@/components/teacher/ScoreGroup";
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
  const presentValue =
    pupil.presentChoice === null ? null : pupil.presentChoice ? "yes" : "no";

  return (
    <div className="divide-y divide-line">
      <div className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="space-y-2">
          <ContentText className="font-medium text-ink">{messages.presentLabel}</ContentText>
          <SegmentedControl
            aria-label={messages.presentLabel}
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
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
        <ContentText tone="secondary" className="text-xs sm:col-span-2">{messages.presentHint}</ContentText>
      </div>

      {isReview ? null : versesToRecite.length > 0 ? (
        <div className="space-y-1 py-3">
          {previousLessonOrdinal !== null ? (
            <ContentText tone="secondary" className="text-sm">
              {messages.versesIntro(previousLessonOrdinal)}
            </ContentText>
          ) : null}
          {versesToRecite.map((verse) => (
            <ScoreGroup
              key={verse.lessonVerseId}
              label={messages.verseLabel(verse.position)}
              max={2}
              value={pupil.verseScores[verse.lessonVerseId] ?? null}
              notRatedLabel={messages.scoreNotRated}
              disabled={disabled}
              onValueChange={(value) => onVerseScoreChange(verse.lessonVerseId, value)}
              trailing={pupil.late ? <LateBadge label={messages.lateSubmitted} /> : null}
            />
          ))}
        </div>
      ) : (
        <ContentText tone="secondary" className="py-3 text-sm">{messages.noVersesFirstLesson}</ContentText>
      )}

      {isReview ? null : hasTest ? (
        <ScoreGroup
          label={messages.testLabel}
          max={10}
          value={pupil.testScore}
          notRatedLabel={messages.scoreNotRated}
          disabled={disabled}
          onValueChange={onTestScoreChange}
          trailing={pupil.late ? <LateBadge label={messages.lateSubmitted} /> : null}
        />
      ) : (
        <ContentText tone="secondary" className="py-3 text-sm">{messages.noTestOnLesson}</ContentText>
      )}

      <ScoreGroup
        label={messages.notebookLabel}
        max={10}
        value={pupil.notebookScore}
        notRatedLabel={messages.scoreNotRated}
        disabled={disabled}
        onValueChange={onNotebookScoreChange}
        trailing={pupil.late ? <LateBadge label={messages.lateSubmitted} /> : null}
      />

      <div className="py-3">
        <Input
          value={pupil.comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder={messages.commentPlaceholder}
          disabled={disabled}
          maxLength={500}
          aria-label={messages.commentPlaceholder}
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
