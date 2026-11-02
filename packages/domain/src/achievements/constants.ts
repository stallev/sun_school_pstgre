/** Achievement rule types — catalog `rule_type` (achievements_spec §3). */
export const ACHIEVEMENT_RULE_TYPE = {
  SERIES: "SERIES",
  ACCUMULATION: "ACCUMULATION",
  ONCE: "ONCE",
  MANUAL: "MANUAL",
  /** Repeatable manual event (ADR-016); never produced by `evaluate`. */
  EVENT: "EVENT",
} as const;
export type AchievementRuleType = (typeof ACHIEVEMENT_RULE_TYPE)[keyof typeof ACHIEVEMENT_RULE_TYPE];

/** Suggestion lifecycle — mirrors Prisma `AchievementSuggestionStatus` (database_schema_v1 §4). */
export const ACHIEVEMENT_SUGGESTION_STATUS = {
  SUGGESTED: "SUGGESTED",
  CONFIRMED: "CONFIRMED",
  DISMISSED: "DISMISSED",
} as const;
export type AchievementSuggestionStatus =
  (typeof ACHIEVEMENT_SUGGESTION_STATUS)[keyof typeof ACHIEVEMENT_SUGGESTION_STATUS];

/** A tier needs teacher confirmation only from this series length (ADR-016 §4; contract §3). */
export const MIN_LESSONS_FOR_CONFIRMATION = 2;

/** Metrics referenced by evaluate and fact scoring (achievements_spec §3, catalog seed). */
export const ACHIEVEMENT_METRIC = {
  LESSON_POINTS_SUM: "lesson_points_sum",
} as const;
export type AchievementMetric = (typeof ACHIEVEMENT_METRIC)[keyof typeof ACHIEVEMENT_METRIC];

export const ACHIEVEMENT_FACT_STATE = {
  CREDITED: "credited",
  NOT_CREDITED: "not_credited",
  SKIP: "skip",
} as const;
export type AchievementFactState = (typeof ACHIEVEMENT_FACT_STATE)[keyof typeof ACHIEVEMENT_FACT_STATE];
