import { USER_ROLE, type UserRole } from "@sunschool/domain";

/** D-18: admin without teacher role on `/group` routes. */
export const shouldShowGroupTeacherForbiddenForAdmin = (
  roles: readonly UserRole[],
): boolean =>
  roles.includes(USER_ROLE.ADMIN) && !roles.includes(USER_ROLE.TEACHER);
