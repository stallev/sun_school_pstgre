"use client";

import { AwardIcon, FlagIcon } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { RowActionsMenu, RowActionsMenuItem } from "@/components/ui/row-actions-menu";
import type { CheckLessonMarksActions } from "@/components/teacher/CheckLessonMarksHost.client";
import type { CheckLessonPupilMarks } from "@/lib/achievements/check-lesson-marks-types";
import { fillMessage } from "@/lib/messages/fill-message";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

type CheckPupilMarksInlineProps = {
  pupilId: string;
  pupilName: string;
  pupilMarks: CheckLessonPupilMarks;
  messages: TeacherCheckMessages;
  actions: Pick<CheckLessonMarksActions, "openAward" | "openPenalty">;
  variant: "table-row" | "card";
};

export const CheckPupilMarksInline = ({
  pupilId,
  pupilName,
  pupilMarks,
  messages,
  actions,
  variant,
}: CheckPupilMarksInlineProps) => {
  const captions =
    pupilMarks.eventCaptions.length > 0 ? (
      <ContentText tone="secondary" className="text-sm">
        {pupilMarks.eventCaptions.join(" · ")}
      </ContentText>
    ) : null;

  const penaltyLine = pupilMarks.penalty ? (
    <ContentText className="text-sm font-medium text-penalty">
      {fillMessage(messages.marksPenaltyIssued, {
        name: pupilMarks.penalty.name,
        points: pupilMarks.penalty.points,
      })}
    </ContentText>
  ) : null;

  if (variant === "table-row") {
    return (
      <div className="mt-1 space-y-1">
        {captions}
        {penaltyLine}
        <RowActionsMenu triggerLabel={fillMessage(messages.marksRowMenuLabel, { name: pupilName })}>
          <RowActionsMenuItem onClick={() => actions.openAward(pupilId, pupilName)}>
            <AwardIcon className="size-4" aria-hidden />
            {messages.marksMenuAward}
          </RowActionsMenuItem>
          <RowActionsMenuItem destructive onClick={() => actions.openPenalty(pupilId, pupilName)}>
            <FlagIcon className="size-4" aria-hidden />
            {messages.marksMenuPenalty}
          </RowActionsMenuItem>
        </RowActionsMenu>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      {captions}
      {penaltyLine}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="default" onClick={() => actions.openAward(pupilId, pupilName)}>
          <AwardIcon className="size-4" aria-hidden />
          {messages.marksAwardButton}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="default"
          onClick={() => actions.openPenalty(pupilId, pupilName)}
        >
          <FlagIcon className="size-4" aria-hidden />
          {messages.marksPenaltyButton}
        </Button>
      </div>
    </div>
  );
};
