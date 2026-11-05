import type { ManualAwardFormData } from "@/lib/achievements/manual-award-types";
import type { PenaltyTypeOption } from "@/lib/achievements/pupil-penalty-form-types";

export type CheckLessonAwardOption = {
  achievementId: string;
  code: string;
  tier: number;
  name: string;
  catalogPoints: number;
  maxPoints: number;
};

export type CheckLessonPupilMarks = {
  eventCaptions: string[];
  penalty:
    | null
    | {
        id: string;
        name: string;
        points: number;
      };
};

export type CheckLessonMarksData =
  | { marksEnabled: false }
  | {
      marksEnabled: true;
      lessonId: string;
      academicYearId: string;
      lessonDateIso: string;
      awardOptions: CheckLessonAwardOption[];
      penaltyTypes: PenaltyTypeOption[];
      eventDate: ManualAwardFormData["eventDate"];
      byPupilId: Record<string, CheckLessonPupilMarks>;
    };
