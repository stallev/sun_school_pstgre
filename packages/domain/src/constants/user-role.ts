/** Mirrors the Prisma enum in @sunschool/db (database_schema_v1 §4). */
export const USER_ROLE = { ADMIN: "ADMIN", TEACHER: "TEACHER", PARENT: "PARENT" } as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
