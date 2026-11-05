"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CancelPenaltyDialog } from "@/components/achievements/CancelPenaltyDialog.client";
import { CheckAwardDialog } from "@/components/teacher/CheckAwardDialog.client";
import { CheckPenaltyDialog } from "@/components/teacher/CheckPenaltyDialog.client";
import type { CheckLessonMarksData, CheckLessonPupilMarks } from "@/lib/achievements/check-lesson-marks-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

export type CheckLessonMarksActions = {
  openAward: (pupilId: string, pupilName: string) => void;
  openPenalty: (pupilId: string, pupilName: string) => void;
  openCancelPenalty: (penaltyId: string) => void;
  getPupilMarks: (pupilId: string) => CheckLessonPupilMarks | null;
};

type CheckLessonMarksHostProps = {
  lessonMarks: CheckLessonMarksData;
  lessonSubtitle: string;
  lessonDateLabel: string;
  messages: TeacherCheckMessages;
  achievementMessages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  children: (actions: CheckLessonMarksActions) => ReactNode;
};

const emptyPupilMarks: CheckLessonPupilMarks = { eventCaptions: [], penalty: null };

export const CheckLessonMarksHost = ({
  lessonMarks,
  lessonSubtitle,
  lessonDateLabel,
  messages,
  achievementMessages,
  dictionaries,
  formError,
  children,
}: CheckLessonMarksHostProps) => {
  const [awardOpen, setAwardOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activePupil, setActivePupil] = useState<{ pupilId: string; pupilName: string } | null>(null);
  const [cancelPenaltyId, setCancelPenaltyId] = useState<string | null>(null);

  const getPupilMarks = useCallback(
    (pupilId: string): CheckLessonPupilMarks | null => {
      if (!lessonMarks.marksEnabled) return null;
      return lessonMarks.byPupilId[pupilId] ?? emptyPupilMarks;
    },
    [lessonMarks],
  );

  const enabled = lessonMarks.marksEnabled;

  const actions: CheckLessonMarksActions = useMemo(
    () => ({
      getPupilMarks,
      openAward: (pupilId, pupilName) => {
        if (!enabled) return;
        setActivePupil({ pupilId, pupilName });
        setAwardOpen(true);
      },
      openPenalty: (pupilId, pupilName) => {
        if (!enabled) return;
        setActivePupil({ pupilId, pupilName });
        setPenaltyOpen(true);
      },
      openCancelPenalty: (penaltyId) => {
        if (!enabled) return;
        setCancelPenaltyId(penaltyId);
        setCancelOpen(true);
      },
    }),
    [enabled, getPupilMarks],
  );

  return (
    <>
      {children(actions)}
      {enabled && activePupil ? (
        <>
          <CheckAwardDialog
            key={`${activePupil.pupilId}-${awardOpen}`}
            open={awardOpen}
            onOpenChange={setAwardOpen}
            pupilId={activePupil.pupilId}
            pupilName={activePupil.pupilName}
            lessonSubtitle={lessonSubtitle}
            lessonId={lessonMarks.lessonId}
            academicYearId={lessonMarks.academicYearId}
            lessonDateIso={lessonMarks.lessonDateIso}
            lessonDateLabel={lessonDateLabel}
            awardOptions={lessonMarks.awardOptions}
            eventDate={lessonMarks.eventDate}
            messages={messages}
            achievementMessages={achievementMessages}
            dictionaries={dictionaries}
            formError={formError}
          />
          <CheckPenaltyDialog
            open={penaltyOpen}
            onOpenChange={setPenaltyOpen}
            pupilId={activePupil.pupilId}
            pupilName={activePupil.pupilName}
            lessonSubtitle={lessonSubtitle}
            lessonId={lessonMarks.lessonId}
            penaltyTypes={lessonMarks.penaltyTypes}
            messages={messages}
            achievementMessages={achievementMessages}
            dictionaries={dictionaries}
            formError={formError}
          />
        </>
      ) : null}
      {enabled && cancelPenaltyId ? (
        <CancelPenaltyDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          penaltyId={cancelPenaltyId}
          cacheRevalidateLessonId={lessonMarks.lessonId}
          messages={achievementMessages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
    </>
  );
};
