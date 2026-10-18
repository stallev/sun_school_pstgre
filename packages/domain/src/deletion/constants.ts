/** deletion_requests_contract §4, Q-01 — calendar days until due_on (legal review pending for prod). */
export const DELETION_DUE_CALENDAR_DAYS = 15;

/** Plan line categories — deletion_requests §6, database_schema_v1 §9. */
export const DELETION_DATA_CATEGORY = {
  LOGIN_IDENTITY: "login_identity",
  APP_USER: "app_user",
  USER_ROLE: "user_role",
  TEACHER_ASSIGNMENT: "teacher_assignment",
  PRIVACY_CONSENT: "privacy_consent",
  ACCESS_REQUEST: "access_request",
  AUDIT_LOG_USER_TEXT: "audit_log_user_text",
  DELETION_REQUEST: "deletion_request",
  PUPIL: "pupil",
  ENROLLMENT: "enrollment",
  CHILD_DATA_CONSENT: "child_data_consent",
  HOMEWORK_CHECK: "homework_check",
  HOMEWORK_VERSE_SCORE: "homework_verse_score",
  HOMEWORK_SCORE_EVENT: "homework_score_event",
  BRICK_LEDGER: "brick_ledger",
  AUDIT_LOG_CHILD: "audit_log_child",
  ACHIEVEMENT_AWARD: "achievement_award",
  PENALTY: "penalty",
  RECITATION_ATTEMPT: "recitation_attempt",
} as const;

export type DeletionDataCategory =
  (typeof DELETION_DATA_CATEGORY)[keyof typeof DELETION_DATA_CATEGORY];

export const DELETION_PLAN_ACTION = {
  DELETE: "delete",
  ANONYMIZE: "anonymize",
  KEEP: "keep",
} as const;

export type DeletionPlanAction = (typeof DELETION_PLAN_ACTION)[keyof typeof DELETION_PLAN_ACTION];

/** deletion_requests_contract §7 — non-blocking plan warnings. */
export const DELETION_PLAN_WARNING = {
  LAST_ADMIN: "last_admin",
  TEACHER_ASSIGNED_ACTIVE_YEAR: "teacher_assigned_active_year",
  INCOMPLETE_HOMEWORK_CHECKS: "incomplete_homework_checks",
} as const;

export type DeletionPlanWarningCode =
  (typeof DELETION_PLAN_WARNING)[keyof typeof DELETION_PLAN_WARNING];
