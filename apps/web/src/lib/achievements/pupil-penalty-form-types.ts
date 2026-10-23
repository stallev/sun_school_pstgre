export type PenaltyTypeOption = {
  achievementId: string;
  label: string;
  catalogPoints: number;
};

export type PenaltyLessonOption = {
  lessonId: string;
  label: string;
};

export type PupilPenaltyFormData = {
  penaltyTypes: PenaltyTypeOption[];
  lessons: PenaltyLessonOption[];
};
