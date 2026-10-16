import { USER_ROLE, type UserRole } from "@sunschool/domain";

/**
 * Route inventory for the optimistic checks (docs/design/canonical_routes.md §4, §6;
 * authorization_matrix §6, §8). `audience` drives the status × route decision in
 * `canVisitRoutePrefix`; `roles` is the AZ-D3 role requirement that the SERVER enforces
 * (`requireRole`) — the proxy never redirects on a role mismatch.
 * Post-MVP routes (/achievements, /child*, /family, /verse*) are deliberately absent.
 */
export type RouteAudience =
  /** Reachable for everyone, signed in or not. */
  | "public"
  /** `/register` — status REGISTRATION. */
  | "register"
  /** `/pending` — REQUEST_PENDING and REJECTED. */
  | "pending"
  /** `/profile` — REQUEST_PENDING, REJECTED, ACTIVE. */
  | "profile"
  /** Application routes — ACTIVE users, narrowed by `roles`. */
  | "app";

export type RouteRule = {
  pattern: RegExp;
  audience: RouteAudience;
  /** For `app` routes: allowed roles (any of). */
  roles?: readonly UserRole[];
};

const ADMIN: readonly UserRole[] = [USER_ROLE.ADMIN];
const TEACHER: readonly UserRole[] = [USER_ROLE.TEACHER];
const ADMIN_OR_TEACHER: readonly UserRole[] = [USER_ROLE.ADMIN, USER_ROLE.TEACHER];

/** First match wins; an exact segment boundary is required (`/users` ≠ `/users-x`). */
export const ROUTE_RULES: readonly RouteRule[] = [
  { pattern: /^\/login$/, audience: "public" },
  { pattern: /^\/privacy$/, audience: "public" },
  { pattern: /^\/register$/, audience: "register" },
  { pattern: /^\/pending$/, audience: "pending" },
  { pattern: /^\/profile$/, audience: "profile" },

  // Teacher; admin only reaches the lesson card / creation (authorization_matrix §8).
  { pattern: /^\/today$/, audience: "app", roles: TEACHER },
  { pattern: /^\/lessons$/, audience: "app", roles: TEACHER },
  { pattern: /^\/lessons\/new$/, audience: "app", roles: ADMIN_OR_TEACHER },
  { pattern: /^\/lessons\/[^/]+(\/(edit|table|check))?$/, audience: "app", roles: ADMIN_OR_TEACHER },
  { pattern: /^\/check$/, audience: "app", roles: TEACHER },
  { pattern: /^\/group$/, audience: "app", roles: TEACHER },

  // Teacher or admin.
  { pattern: /^\/(calendar|rating|verses|bricks)$/, audience: "app", roles: ADMIN_OR_TEACHER },
  { pattern: /^\/analytics(\/pupils\/[^/]+)?$/, audience: "app", roles: ADMIN_OR_TEACHER },

  // Admin only.
  { pattern: /^\/(school|approvals|people|year|deletions|audit|settings)$/, audience: "app", roles: ADMIN },
  { pattern: /^\/users(\/[^/]+)?$/, audience: "app", roles: ADMIN },
  { pattern: /^\/groups(\/[^/]+)?$/, audience: "app", roles: ADMIN },
];

/** Path without query, hash and trailing slash; always starts with `/`. */
export const normalizePathname = (pathname: string): string => {
  const [path = "/"] = pathname.split(/[?#]/, 1);
  const trimmed = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return trimmed.startsWith("/") ? trimmed || "/" : `/${trimmed}`;
};

export const matchRoute = (pathname: string): RouteRule | null => {
  const path = normalizePathname(pathname);
  return ROUTE_RULES.find((rule) => rule.pattern.test(path)) ?? null;
};

/** True for a path that exists in the canonical inventory (used to vet `callbackUrl`). */
export const isCanonicalRoute = (pathname: string): boolean => matchRoute(pathname) !== null;

/** Roles that may open the route (AZ-D3), or `null` when the route is not role-restricted / unknown. */
export const routeRoles = (pathname: string): readonly UserRole[] | null => matchRoute(pathname)?.roles ?? null;
