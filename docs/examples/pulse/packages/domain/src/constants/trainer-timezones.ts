/** Curated IANA timezones for trainer onboarding dropdown (MVP). */
export const TRAINER_TIMEZONES = [
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

export type TrainerTimezone = (typeof TRAINER_TIMEZONES)[number];

export const TRAINER_TIMEZONE_SET = new Set<string>(TRAINER_TIMEZONES);

export function isTrainerTimezone(value: string): value is TrainerTimezone {
  return TRAINER_TIMEZONE_SET.has(value);
}
