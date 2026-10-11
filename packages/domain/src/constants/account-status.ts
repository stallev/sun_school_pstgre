/** Mirrors the Prisma enum in @sunschool/db (database_schema_v1 §4). */
export const ACCOUNT_STATUS = {
  REGISTRATION: "REGISTRATION",
  REQUEST_PENDING: "REQUEST_PENDING",
  REJECTED: "REJECTED",
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  DELETED: "DELETED",
} as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];
