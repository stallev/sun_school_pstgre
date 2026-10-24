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
