"use client";

import { useState } from "react";
import { LESSON_KIND, type LessonKind, type LessonVerseToRecite } from "@sunschool/domain";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { CheckScaleField } from "@/components/teacher/CheckScaleField";
import { CheckVerseField } from "@/components/teacher/CheckVerseField";
import { LateBadge } from "@/components/teacher/LateBadge";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type CheckScoresPupil = {
  pupilId: string;
  presentChoice: boolean | null;
  late: boolean;
  verseScores: Record<string, number | null>;
  testScore: number | null;
  notebookScore: number | null;
};

type CheckScoresSectionProps = {
  pupil: CheckScoresPupil;
  lessonKind: LessonKind;
  hasTest: boolean;
  versesToRecite: readonly LessonVerseToRecite[];
  previousLessonOrdinal: number | null;
  disabled: boolean;
  messages: TeacherCheckMessages;
  onVerseScoreChange: (lessonVerseId: string, value: number | null) => void;
  onTestScoreChange: (value: number | null) => void;
  onNotebookScoreChange: (value: number | null) => void;
};

const bandOf = (value: number | null, messages: TeacherCheckMessages) => {
  if (value === null) return { label: "", className: "" };
  if (value <= 4) return { label: messages.bandLow, className: "text-danger" };
  if (value >= 8) return { label: messages.bandHigh, className: "text-ok" };
  return { label: messages.bandMid, className: "text-ink-2" };
};

export const CheckScoresSection = ({
  pupil,
  lessonKind,
  hasTest,
  versesToRecite,
  previousLessonOrdinal,
  disabled,
  messages,
  onVerseScoreChange,
  onTestScoreChange,
  onNotebookScoreChange,
}: CheckScoresSectionProps) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [revealedPupilId, setRevealedPupilId] = useState<string | null>(null);
  const [trackedPresent, setTrackedPresent] = useState(pupil.presentChoice);
  if (pupil.presentChoice !== trackedPresent) {
    setTrackedPresent(pupil.presentChoice);
    if (pupil.presentChoice !== false) setRevealedPupilId(null);
  }
  const isReview = lessonKind === LESSON_KIND.REVIEW;
  const collapsed = pupil.presentChoice === false && !pupil.late && revealedPupilId !== pupil.pupilId;
  const late = pupil.late ? <LateBadge label={messages.lateSubmitted} /> : null;
  const testBand = bandOf(pupil.testScore, messages);
  const notebookBand = bandOf(pupil.notebookScore, messages);

  if (collapsed) {
    return (
      <div className="py-3">
        <Button type="button" variant="outline" disabled={disabled} onClick={() => setRevealedPupilId(pupil.pupilId)}>
          {messages.showScores}
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {isReview ? null : versesToRecite.length > 0 ? (
        <div>
          {previousLessonOrdinal !== null ? (
            <ContentText tone="secondary" className="pt-3 text-sm">
              {fillMessage(messages.versesIntro, { lessonOrdinal: previousLessonOrdinal })}
            </ContentText>
          ) : null}
          {versesToRecite.map((verse) => (
            <CheckVerseField
              key={verse.lessonVerseId}
              label={fillMessage(messages.verseLabel, { position: verse.position })}
              value={pupil.verseScores[verse.lessonVerseId] ?? null}
              unsetLabel={messages.scoreUnset}
              notRatedLabel={messages.scoreNotRated}
              disabled={disabled}
              trailing={late}
              onValueChange={(value) => onVerseScoreChange(verse.lessonVerseId, value)}
            />
          ))}
        </div>
      ) : (
        <ContentText tone="secondary" className="py-3 text-sm">
          {messages.noVersesFirstLesson}
        </ContentText>
      )}
      {isReview ? null : hasTest ? (
        <CheckScaleField
          fieldKey="test"
          label={messages.testLabel}
          value={pupil.testScore}
          open={openKey === "test"}
          notRatedLabel={messages.scoreNotRated}
          bandLabel={testBand.label}
          bandClassName={testBand.className}
          disabled={disabled}
          trailing={late}
          onOpenChange={setOpenKey}
          onValueChange={onTestScoreChange}
        />
      ) : isReview ? null : (
        <ContentText tone="secondary" className="py-3 text-sm">{messages.noTestOnLesson}</ContentText>
      )}
      <CheckScaleField
        fieldKey="notebook"
        label={messages.notebookLabel}
        value={pupil.notebookScore}
        open={openKey === "notebook"}
        notRatedLabel={messages.scoreNotRated}
        bandLabel={notebookBand.label}
        bandClassName={notebookBand.className}
        disabled={disabled}
        trailing={late}
        onOpenChange={setOpenKey}
        onValueChange={onNotebookScoreChange}
      />
    </div>
  );
};
