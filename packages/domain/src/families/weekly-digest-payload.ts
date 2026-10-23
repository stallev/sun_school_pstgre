export type WeeklyDigestPayload = {
  awardIds: string[];
  penaltyIds: string[];
  lateCheckIds: string[];
};

export const emptyWeeklyDigestPayload = (): WeeklyDigestPayload => ({
  awardIds: [],
  penaltyIds: [],
  lateCheckIds: [],
});
