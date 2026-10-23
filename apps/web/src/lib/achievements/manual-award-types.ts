export type ManualAwardPupilOption = { pupilId: string; displayName: string };

export type ManualAwardAchievementOption = {
  achievementId: string;
  tier: number;
  label: string;
  catalogPoints: number;
  evidenceNeed: number;
};

export type ManualAwardEvidenceOption = {
  checkId: string;
  label: string;
  suggested: boolean;
};

export type ManualAwardFormData = {
  pupils: ManualAwardPupilOption[];
  achievements: ManualAwardAchievementOption[];
};

export const manualAwardSelectClass =
  "h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
