export const TEACHER_HINT_KEYS = [
  "regular_attendance",
  "attendance_rate",
  "average_score",
  "checked_state",
  "lesson_type",
  "lesson_leader",
  "score_threshold",
  "verse_scale",
  "check_status",
  "filled_fields",
  "all_scores_table",
  "bricks_collected",
  "bricks_issued",
  "bricks_left",
  "bricks_issue",
  "calendar_event_kinds",
  "verses_order",
] as const;

export type TeacherHintKey = (typeof TEACHER_HINT_KEYS)[number];
