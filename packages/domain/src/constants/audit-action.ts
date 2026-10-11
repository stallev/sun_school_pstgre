/**
 * Audit registry — canon: change_log_contract.md §3–§4. A new action is added here FIRST and in
 * the contract's registry table in the same change. Only the actions owned by P01 are listed;
 * later phases extend the object (`school.*`, `lesson.*`, `check.*`, `bricks.*`, `deletion.*`).
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
  SETTINGS_LANGUAGE_CHANGED: "settings.language_changed",
  SETTINGS_TIMEZONE_CHANGED: "settings.timezone_changed",
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
  SEED: "seed",
} as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPE)[keyof typeof AUDIT_ENTITY_TYPE];
