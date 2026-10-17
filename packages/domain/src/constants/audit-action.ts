/**
 * Audit registry — canon: change_log_contract.md §3–§4. A new action is added here FIRST and in
 * the contract's registry table in the same change.
 */
export const AUDIT_ACTION = {
  ACCESS_FIRST_ADMIN_CREATED: "access.first_admin_created",
  ACCESS_REGISTRATION_SUBMITTED: "access.registration_submitted",
  ACCESS_REGISTRATION_RESUBMITTED: "access.registration_resubmitted",
  ACCESS_REQUEST_APPROVED: "access.request_approved",
  ACCESS_REQUEST_REJECTED: "access.request_rejected",
  ACCESS_ROLES_CHANGED: "access.roles_changed",
  ACCESS_DISABLED: "access.disabled",
  ACCESS_ENABLED: "access.enabled",
  ACCESS_NAME_CHANGED: "access.name_changed",
  ACCESS_USERS_MERGED: "access.users_merged",
  ACCESS_REGISTRATION_PURGED: "access.registration_purged",
  AUTH_IDENTITY_LINKED: "auth.identity_linked",
  AUTH_IDENTITY_UNLINKED: "auth.identity_unlinked",
  AUTH_PASSWORD_SET: "auth.password_set",
  SETTINGS_LANGUAGE_CHANGED: "settings.language_changed",
  SETTINGS_TIMEZONE_CHANGED: "settings.timezone_changed",
  SCHOOL_YEAR_CREATED: "school.year_created",
  SCHOOL_YEAR_ACTIVATED: "school.year_activated",
  SCHOOL_YEAR_CLOSED: "school.year_closed",
  SCHOOL_GROUP_CREATED: "school.group_created",
  SCHOOL_GROUP_UPDATED: "school.group_updated",
  SCHOOL_GROUP_DEACTIVATED: "school.group_deactivated",
  SCHOOL_GROUP_LANGUAGE_CHANGED: "school.group_language_changed",
  SCHOOL_TEACHER_ASSIGNED: "school.teacher_assigned",
  SCHOOL_TEACHER_UNASSIGNED: "school.teacher_unassigned",
  SCHOOL_SETTINGS_CHANGED: "school.settings_changed",
  SCHOOL_PUPIL_CREATED: "school.pupil_created",
  SCHOOL_PUPIL_UPDATED: "school.pupil_updated",
  SCHOOL_PUPIL_DEACTIVATED: "school.pupil_deactivated",
  SCHOOL_CONSENT_RECORDED: "school.consent_recorded",
  SCHOOL_CONSENT_REVOKED: "school.consent_revoked",
  SCHOOL_PUPIL_ENROLLED: "school.pupil_enrolled",
  SCHOOL_PUPIL_UNENROLLED: "school.pupil_unenrolled",
  SCHOOL_PUPIL_TRANSFERRED: "school.pupil_transferred",
  SCHOOL_LEGACY_DEADLINE_EXTENDED: "school.legacy_deadline_extended",
  SCHOOL_LEGACY_PUPIL_IMPORTED: "school.legacy_pupil_imported",
  SEED_RUN: "seed.run",
} as const;
export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

/** Who caused the change: a signed-in user or the system (lazy purge, seed). */
export const AUDIT_SOURCE = { USER: "USER", SYSTEM: "SYSTEM" } as const;
export type AuditSource = (typeof AUDIT_SOURCE)[keyof typeof AUDIT_SOURCE];

export const AUDIT_ENTITY_TYPE = {
  APP_USER: "app_user",
  ACCESS_REQUEST: "access_request",
  LOGIN_IDENTITY: "login_identity",
  APP_SETTING: "app_setting",
  ACADEMIC_YEAR: "academic_year",
  GRADE: "grade",
  GRADE_SETTINGS: "grade_settings",
  TEACHER_ASSIGNMENT: "teacher_assignment",
  PUPIL: "pupil",
  CHILD_DATA_CONSENT: "child_data_consent",
  ENROLLMENT: "enrollment",
  SEED: "seed",
} as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPE)[keyof typeof AUDIT_ENTITY_TYPE];
