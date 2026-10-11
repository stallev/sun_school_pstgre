/** Mirrors the Prisma enum in @sunschool/db (database_schema_v1 §4). */
export const ACCESS_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUS)[keyof typeof ACCESS_REQUEST_STATUS];
