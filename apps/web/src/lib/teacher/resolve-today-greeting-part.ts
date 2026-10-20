export type TodayGreetingPart = "morning" | "afternoon" | "evening";

/** Hour in school time zone (0–23) → greeting copy variant. */
export const resolveTodayGreetingPart = (hour: number): TodayGreetingPart => {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
};
