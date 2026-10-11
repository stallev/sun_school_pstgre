/**
 * Domain enums — canon: docs/prds/03_data_model/database_schema_v1.md §4.
 * Values are UPPER_SNAKE and mirror the Prisma enums in @sunschool/db.
 * Each enum is a const object plus a union type.
 */

export const USER_ROLE = { ADMIN: "ADMIN", TEACHER: "TEACHER", PARENT: "PARENT" } as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const ACCOUNT_STATUS = {
  REGISTRATION: "REGISTRATION",
  REQUEST_PENDING: "REQUEST_PENDING",
  REJECTED: "REJECTED",
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  DELETED: "DELETED",
} as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const LOGIN_PROVIDER = { GOOGLE: "GOOGLE", TELEGRAM: "TELEGRAM" } as const;
export type LoginProvider = (typeof LOGIN_PROVIDER)[keyof typeof LOGIN_PROVIDER];

export const ACCESS_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUS)[keyof typeof ACCESS_REQUEST_STATUS];

export const ACADEMIC_YEAR_STATUS = { DRAFT: "DRAFT", ACTIVE: "ACTIVE", CLOSED: "CLOSED" } as const;
export type AcademicYearStatus = (typeof ACADEMIC_YEAR_STATUS)[keyof typeof ACADEMIC_YEAR_STATUS];

export const LESSON_KIND = { REGULAR: "REGULAR", REVIEW: "REVIEW" } as const;
export type LessonKind = (typeof LESSON_KIND)[keyof typeof LESSON_KIND];

export const LESSON_STATUS = { HELD: "HELD", CHECK_COMPLETED: "CHECK_COMPLETED" } as const;
export type LessonStatus = (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];

export const SCORE_SOURCE = { MANUAL: "MANUAL", VOICE: "VOICE" } as const;
export type ScoreSource = (typeof SCORE_SOURCE)[keyof typeof SCORE_SOURCE];

export const GRADE_EVENT_TYPE = { LESSON: "LESSON", TRIP: "TRIP", CANCELLATION: "CANCELLATION" } as const;
export type GradeEventType = (typeof GRADE_EVENT_TYPE)[keyof typeof GRADE_EVENT_TYPE];

export const CONSENT_CHANNEL = { ELECTRONIC: "ELECTRONIC", PAPER: "PAPER" } as const;
export type ConsentChannel = (typeof CONSENT_CHANNEL)[keyof typeof CONSENT_CHANNEL];

export const CONSENT_STATUS = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  LEGACY_PENDING: "LEGACY_PENDING",
} as const;
export type ConsentStatus = (typeof CONSENT_STATUS)[keyof typeof CONSENT_STATUS];

export const DELETION_REQUEST_TYPE = { ACCOUNT: "ACCOUNT", CHILD_DATA: "CHILD_DATA" } as const;
export type DeletionRequestType = (typeof DELETION_REQUEST_TYPE)[keyof typeof DELETION_REQUEST_TYPE];

export const DELETION_REQUEST_STATUS = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type DeletionRequestStatus =
  (typeof DELETION_REQUEST_STATUS)[keyof typeof DELETION_REQUEST_STATUS];

export const BIBLE_TRANSLATION_STATUS = { NO_DATA: "NO_DATA", LOADING: "LOADING", READY: "READY" } as const;
export type BibleTranslationStatus =
  (typeof BIBLE_TRANSLATION_STATUS)[keyof typeof BIBLE_TRANSLATION_STATUS];

export const APP_LOCALE = { RU: "RU", EN: "EN" } as const;
export type AppLocale = (typeof APP_LOCALE)[keyof typeof APP_LOCALE];

export const CONSENT_TYPE = {
  PD_PROCESSING: "PD_PROCESSING",
  CHILD_DATA: "CHILD_DATA",
  VOICE: "VOICE",
  PHOTO: "PHOTO",
} as const;
export type ConsentType = (typeof CONSENT_TYPE)[keyof typeof CONSENT_TYPE];

// post-MVP (schema §4, tables without UI)
export const ADULT_RELATION = { MOTHER: "MOTHER", FATHER: "FATHER", GUARDIAN: "GUARDIAN" } as const;
export type AdultRelation = (typeof ADULT_RELATION)[keyof typeof ADULT_RELATION];

export const ACHIEVEMENT_KIND = { REWARD: "REWARD", PENALTY: "PENALTY" } as const;
export type AchievementKind = (typeof ACHIEVEMENT_KIND)[keyof typeof ACHIEVEMENT_KIND];

export const AWARD_SOURCE = { AUTO: "AUTO", MANUAL: "MANUAL" } as const;
export type AwardSource = (typeof AWARD_SOURCE)[keyof typeof AWARD_SOURCE];

export const PENALTY_STATUS = { ACTIVE: "ACTIVE", CANCELLED: "CANCELLED" } as const;
export type PenaltyStatus = (typeof PENALTY_STATUS)[keyof typeof PENALTY_STATUS];

export const RECITATION_STATUS = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  SCORED: "SCORED",
  FAILED: "FAILED",
} as const;
export type RecitationStatus = (typeof RECITATION_STATUS)[keyof typeof RECITATION_STATUS];
