"use client";

import { AwardIcon, FlagIcon, Undo2Icon } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import type { CheckLessonPupilMarks } from "@/lib/achievements/check-lesson-marks-types";
import { fillMessage } from "@/lib/messages/fill-message";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

type CheckMarksBlockProps = {
  pupilMarks: CheckLessonPupilMarks;
  messages: TeacherCheckMessages;
  onAward: () => void;
  onPenalty: () => void;
  onCancelPenalty: () => void;
};

export const CheckMarksBlock = ({
  pupilMarks,
  messages,
  onAward,
  onPenalty,
  onCancelPenalty,
}: CheckMarksBlockProps) => (
  <div className="flex flex-col gap-2 border-b border-line py-3">
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="default" onClick={onAward}>
        <AwardIcon className="size-4" aria-hidden />
        {messages.marksAwardButton}
      </Button>
      {pupilMarks.penalty ? (
        <>
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-penalty">
            <FlagIcon className="size-4 shrink-0" aria-hidden />
            <span>
              {fillMessage(messages.marksPenaltyIssued, {
                name: pupilMarks.penalty.name,
                points: pupilMarks.penalty.points,
              })}
            </span>
          </span>
          <Button type="button" variant="ghost" size="default" onClick={onCancelPenalty}>
            <Undo2Icon className="size-4" aria-hidden />
            {messages.marksRemovePenalty}
          </Button>
        </>
      ) : (
        <Button type="button" variant="destructive" size="default" onClick={onPenalty}>
          <FlagIcon className="size-4" aria-hidden />
          {messages.marksPenaltyButton}
        </Button>
      )}
    </div>
    {pupilMarks.eventCaptions.length > 0 ? (
      <ContentText tone="secondary" className="text-sm">
        {pupilMarks.eventCaptions.join(" · ")}
      </ContentText>
    ) : null}
    <ContentText tone="secondary" className="text-sm">
      {messages.marksGradesNote}
    </ContentText>
  </div>
);
