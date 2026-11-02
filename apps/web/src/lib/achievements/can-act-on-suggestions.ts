/**
 * Whether the pupil panel offers the suggestion actions (AZ-66).
 * Group mode is deliberately not an input: dismiss works with the mode off (suggestions contract §6.4),
 * confirm and defer are refused server-side with `ACHIEVEMENT_MODE_OFF`.
 */
export const canActOnSuggestions = (yearClosed: boolean, isAdmin: boolean): boolean =>
  !yearClosed || isAdmin;
