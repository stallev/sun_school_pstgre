import type { UserRole } from "@pulse/domain";

const ROLE_HOME: Record<UserRole, string> = {
  client: "/client/dashboard",
  trainer: "/trainer/dashboard",
  admin: "/admin/dashboard",
};

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role];
}
