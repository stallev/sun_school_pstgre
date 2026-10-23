import { ACCOUNT_STATUS, USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";

/**
 * Where a user belongs after sign-in or when a route is not open for the status
 * (authorization_matrix §6): `REGISTRATION → /register`, `REQUEST_PENDING | REJECTED → /pending`,
 * `ACTIVE`: ADMIN → `/school` (wins when both roles are held), TEACHER → `/today`, otherwise
 * `/profile`; `DISABLED | DELETED | unknown | no session → /login`.
 */
export const LOGIN_ROUTE = "/login";

/**
 * Terminal page for a user whose server-side status no longer allows access while the JWT still
 * says otherwise (AZ-D5: disabled, deleted, row gone). `/login?error=…` is open for every status in
 * the proxy, so this redirect cannot bounce back into the app.
 */
export const ACCESS_DENIED_ROUTE = "/login?error=AccessDenied";

export const homeRouteFor = (status: AccountStatus | null | undefined, roles: readonly UserRole[]): string => {
  switch (status) {
    case ACCOUNT_STATUS.REGISTRATION:
      return "/register";
    case ACCOUNT_STATUS.REQUEST_PENDING:
    case ACCOUNT_STATUS.REJECTED:
      return "/pending";
    case ACCOUNT_STATUS.ACTIVE:
      if (roles.includes(USER_ROLE.ADMIN)) return "/school";
      if (roles.includes(USER_ROLE.TEACHER)) return "/today";
      if (roles.includes(USER_ROLE.PARENT)) return "/child";
      return "/profile";
    default:
      return LOGIN_ROUTE;
  }
};
