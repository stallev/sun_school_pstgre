/** Mirrors the Prisma enum in @sunschool/db (database_schema_v1 §4). */
/** CREDENTIALS = email + password of an administrator (ADR-003 v1.1); Google is not used. */
export const LOGIN_PROVIDER = { CREDENTIALS: "CREDENTIALS", TELEGRAM: "TELEGRAM" } as const;
export type LoginProvider = (typeof LOGIN_PROVIDER)[keyof typeof LOGIN_PROVIDER];
