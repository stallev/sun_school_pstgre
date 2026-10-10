export const USER_ROLES = ["client", "trainer", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE = {
  CLIENT: "client",
  TRAINER: "trainer",
  ADMIN: "admin",
} as const satisfies Record<string, UserRole>;
