/** Unique key for accumulation / once awards (achievements_spec §7.1, ДС-11). */
export function buildAchievementAwardKey(input: {
  pupilId: string;
  achievementId: string;
  tier: number;
  academicYearId: string;
}): string {
  return `${input.pupilId}:${input.achievementId}:${input.tier}:${input.academicYearId}`;
}
