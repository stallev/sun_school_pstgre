import { USER_ROLE, type UserRole } from "@sunschool/domain";
import type { AdminMessages } from "@/lib/messages/admin-messages";

export const formatUserRolesLabel = (roles: readonly UserRole[], messages: AdminMessages): string => {
  const hasAdmin = roles.includes(USER_ROLE.ADMIN);
  const hasTeacher = roles.includes(USER_ROLE.TEACHER);
  if (hasAdmin && hasTeacher) return messages.users.rolesAdminTeacher;
  if (hasAdmin) return messages.users.rolesAdmin;
  if (hasTeacher) return messages.users.rolesTeacher;
  return messages.users.rolesNone;
};
