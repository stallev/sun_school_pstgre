import { USER_ROLES, type UserRole } from "../types/user-role";

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}
