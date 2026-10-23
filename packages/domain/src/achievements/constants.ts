/** Achievement rule types — catalog `rule_type` (achievements_spec §3). */
export const ACHIEVEMENT_RULE_TYPE = {
  SERIES: "SERIES",
  ACCUMULATION: "ACCUMULATION",
  ONCE: "ONCE",
  MANUAL: "MANUAL",
} as const;
export type AchievementRuleType = (typeof ACHIEVEMENT_RULE_TYPE)[keyof typeof ACHIEVEMENT_RULE_TYPE];

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
