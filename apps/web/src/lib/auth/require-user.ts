import "server-only";
import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import { ACCOUNT_STATUS, type UserRole } from "@sunschool/domain";
import { ACCESS_DENIED_ROUTE, homeRouteFor, LOGIN_ROUTE } from "@sunschool/policy-edge";
import { checkRole, type PolicySessionContext } from "@sunschool/policy-server";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/db.server";

/**
 * Server-side authorization (auth_runtime_spec §10, ADR-003 §4.3, AZ-D1…D5). The JWT is only an
 * optimistic slice: status and roles are read from the DATABASE here, so a disabled user or a
 * removed role loses access on the next server check without signing in again.
 * - `userId` comes only from the session;
 * - the status/roles read is cached for ONE request (`React.cache`), never across requests and
 *   never with `'use cache'` (user data, ADR-002 §5).
 */

/** Authoritative context of a user id, or `null` when the user no longer exists. */
const loadPolicyContext = cache(async (userId: string): Promise<PolicySessionContext | null> => {
  const db = await getPrisma();
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: { id: true, status: true, roles: { select: { role: true } } },
  });
  if (!user) return null;
  return { userId: user.id, status: user.status, roles: user.roles.map((entry) => entry.role) };
});

/** AZ-D1: no session → `/login`. */
export async function requireSession(): Promise<{ uid: string }> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) redirect(LOGIN_ROUTE);
  return { uid };
}

/**
 * AZ-D2: an ACTIVE user's context from the DB; a not-yet-active user goes to the home route of the
 * status (authorization_matrix §6). A user whose row is gone or who became DISABLED / DELETED while
 * the JWT still says ACTIVE (AZ-D5) is sent to the terminal `/login?error=AccessDenied`: the proxy
 * keeps that page open for any status, so the two checks cannot redirect each other in a loop.
 * (The login screen of P01-CU8 ends the stale session on that error.)
 */
export async function requireActiveUser(): Promise<PolicySessionContext> {
  const { uid } = await requireSession();
  const context = await loadPolicyContext(uid);
  if (!context || context.status === ACCOUNT_STATUS.DISABLED || context.status === ACCOUNT_STATUS.DELETED) {
    redirect(ACCESS_DENIED_ROUTE);
  }
  if (context.status !== ACCOUNT_STATUS.ACTIVE) redirect(homeRouteFor(context.status, context.roles));
  return context;
}

/**
 * AZ-06 / AZ-P4: session + DB context for users who may self-service deletion (not `DELETED`);
 * non-`ACTIVE` statuses (`REQUEST_PENDING`, `REJECTED`, …) are allowed — unlike `requireActiveUser`.
 */
export async function requireNonDeletedUser(): Promise<PolicySessionContext> {
  const { uid } = await requireSession();
  const context = await loadPolicyContext(uid);
  if (!context || context.status === ACCOUNT_STATUS.DELETED) {
    redirect(ACCESS_DENIED_ROUTE);
  }
  return context;
}

/** AZ-D3: an ACTIVE user without one of the roles gets the 403 page (not a redirect). */
export async function requireRole(...allowed: UserRole[]): Promise<PolicySessionContext> {
  const context = await requireActiveUser();
  if (!checkRole(context, allowed).allowed) forbidden();
  return context;
}
