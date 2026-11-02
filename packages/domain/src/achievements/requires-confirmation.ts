import { MIN_LESSONS_FOR_CONFIRMATION } from "./constants";

/**
 * Whether a proposed tier becomes a teacher-confirmed suggestion instead of an auto award
 * (achievement_suggestions_contract §3, ADR-016 §4).
 */
export function requiresConfirmation(
  achievement: { requiresConfirmation: boolean },
  tierLength: number,
): boolean {
  return achievement.requiresConfirmation && tierLength >= MIN_LESSONS_FOR_CONFIRMATION;
}
