import { USER_ROLE, type UserRole } from "@sunschool/domain";

export const VIEW_AS_COOKIE_NAME = "view_as";
export const VIEW_AS_COOKIE_MAX_AGE_SECONDS = 2_592_000;

export const isViewAsRoleValue = (value: string): value is UserRole =>
  value === USER_ROLE.ADMIN || value === USER_ROLE.TEACHER;

/** Server: `cookies().get(name)?.value` — only `admin` | `teacher`, else `null`. */
export const parseViewAsCookie = (value: string | undefined): UserRole | null => {
  if (!value || !isViewAsRoleValue(value)) return null;
  return value;
};

/** Client: persist UI preview role (not HttpOnly, not auth). */
export const writeViewAsCookie = (role: UserRole): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${VIEW_AS_COOKIE_NAME}=${role}; Path=/; Max-Age=${VIEW_AS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

/** Only real admins may preview another role; invalid cookie → real shell role. */
export const resolveViewAsRole = (
  cookieValue: string | undefined,
  shellRole: UserRole,
): UserRole => {
  const parsed = parseViewAsCookie(cookieValue);
  if (!parsed || shellRole !== USER_ROLE.ADMIN) return shellRole;
  return parsed;
};
