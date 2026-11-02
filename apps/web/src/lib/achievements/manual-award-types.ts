import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type ManualAwardPupilOption = { pupilId: string; displayName: string };

export type ManualAwardAchievementOption = {
  achievementId: string;
  tier: number;
  label: string;
  catalogPoints: number;
  evidenceNeed: number;
  /** Repeatable event (`EVENT`): date field instead of lessons (ADR-016). */
  isEvent: boolean;
};

export type ManualAwardEvidenceOption = {
  checkId: string;
  label: string;
  suggested: boolean;
};

export type ManualAwardEventDate = {
  locale: MessageLocale;
  /** Default and upper bound: today in the school time zone (`YYYY-MM-DD`). */
  today: string;
  /** Academic year start (`YYYY-MM-DD`). */
  min: string;
};

export type ManualAwardFormData = {
  pupils: ManualAwardPupilOption[];
  achievements: ManualAwardAchievementOption[];
  eventDate: ManualAwardEventDate;
};
