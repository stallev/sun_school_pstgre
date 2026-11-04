export const ANALYTICS_HINT_KEYS = [
  "rating_place",
  "record_without_mark",
  "low_score",
  "not_in_average",
  "year_totals",
  "averaged_over",
  "composition",
] as const;

export type AnalyticsHintKey = (typeof ANALYTICS_HINT_KEYS)[number];
