/**
 * Unique key for accumulation / once awards (achievements_spec §7.1, ДС-11).
 * Repeatable `EVENT` awards append the event date `YYYY-MM-DD` (ADR-016 §10 Q-1).
 */
export function buildAchievementAwardKey(input: {
  pupilId: string;
  achievementId: string;
  tier: number;
  academicYearId: string;
  eventOn?: string;
}): string {
  const base = `${input.pupilId}:${input.achievementId}:${input.tier}:${input.academicYearId}`;
  return input.eventOn === undefined ? base : `${base}:${input.eventOn}`;
}
