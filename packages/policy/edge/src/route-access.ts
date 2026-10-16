import { ACCOUNT_STATUS, type AccountStatus, type UserRole } from "@sunschool/domain";
import { homeRouteFor, LOGIN_ROUTE } from "./home-route";
import { matchRoute, normalizePathname } from "./route-table";

/**
 * JWT-only view of the session for proxy.ts (no DB). Built from the token claims
 * `uid` / `status` / `roles` — auth_runtime_spec §5.2. The decision is optimistic: the
 * authoritative check is `requireActiveUser()` on the server (AZ-D5).
 */
export type EdgeSession = {
  userId: string;
  status: AccountStatus;
  roles: readonly UserRole[];
};

export type EdgeDecision = { kind: "allow" } | { kind: "redirect"; to: string };

const ALLOW: EdgeDecision = { kind: "allow" };
const redirect = (to: string): EdgeDecision => ({ kind: "redirect", to });

/**
 * Status × route table of authorization_matrix §6 (optimistic redirect by JWT claims):
 * - no session → `/login`, except `/login` and `/privacy`;
 * - `REGISTRATION` → only `/register` and `/privacy`; everything else → `/register`;
 * - `REQUEST_PENDING` / `REJECTED` → `/pending`, `/profile`, `/privacy`; everything else → `/pending`;
 * - `ACTIVE` → application routes, `/profile`, `/privacy`, `/register` (consent refresh, РГ-5; page redirects when not needed);
 *   `/login`, `/pending` and `/` → home;
 * - `DISABLED` / `DELETED` / an unknown status → `/login` and `/privacy` only;
 * - `/login?error=…` is always open (terminal error page, no redirect loops);
 * - a wrong ROLE on an application route is NOT redirected here (AZ-D3: the server answers 403);
 * - `/design-system` (dev guard lives in its layout) and `/api/*` (handlers call `requireActiveUser()`
 *   first; `/api/auth/*` is excluded by the proxy matcher) pass through.
 */
export function canVisitRoutePrefix(session: EdgeSession | null, pathname: string): EdgeDecision {
  const path = normalizePathname(pathname);
  if (path === "/design-system" || path.startsWith("/design-system/") || path === "/api" || path.startsWith("/api/")) {
    return ALLOW;
  }
  // `/login?error=…` (Auth.js errors, ACCESS_DENIED_ROUTE) is a terminal page: open for every status,
  // otherwise a stale ACTIVE JWT and a disabled account would redirect each other forever.
  if (path === LOGIN_ROUTE && /[?&]error=/.test(pathname)) return ALLOW;
  const audience = matchRoute(path)?.audience ?? null;
  const isPrivacy = path === "/privacy";

  if (!session) {
    return audience === "public" ? ALLOW : redirect(LOGIN_ROUTE);
  }

  const home = homeRouteFor(session.status, session.roles);
  switch (session.status) {
    case ACCOUNT_STATUS.REGISTRATION:
      return audience === "register" || isPrivacy ? ALLOW : redirect(home);
    case ACCOUNT_STATUS.REQUEST_PENDING:
    case ACCOUNT_STATUS.REJECTED:
      return audience === "pending" || audience === "profile" || isPrivacy ? ALLOW : redirect(home);
    case ACCOUNT_STATUS.ACTIVE:
      if (audience === "app" || audience === "profile" || isPrivacy || audience === "register") return ALLOW;
      if (audience === null && path !== "/") return ALLOW; // unknown path → the 404 page
      return redirect(home); // /login, /pending, /
    case ACCOUNT_STATUS.DISABLED:
    case ACCOUNT_STATUS.DELETED:
      return audience === "public" ? ALLOW : redirect(LOGIN_ROUTE);
    default:
      // Unknown status: deny (S path of P01-T12).
      return isPrivacy || path === LOGIN_ROUTE ? ALLOW : redirect(LOGIN_ROUTE);
  }
}
