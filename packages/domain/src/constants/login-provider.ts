/** Mirrors the Prisma enum in @sunschool/db (database_schema_v1 §4). */
export const LOGIN_PROVIDER = { GOOGLE: "GOOGLE", TELEGRAM: "TELEGRAM" } as const;
export type LoginProvider = (typeof LOGIN_PROVIDER)[keyof typeof LOGIN_PROVIDER];
