import type { UserRole } from "@sunschool/domain";
import { isActive, type PolicyDecision, type PolicySessionContext } from "./context";

/**
 * AZ-D3 / AZ-D5: an ACTIVE user without any of the allowed roles gets FORBIDDEN (a 403 page, not a
 * redirect); a user who is no longer ACTIVE is FORBIDDEN as well (status re-read from the DB).
 * An empty `allowed` list denies everyone — a role requirement is never silently skipped.
 */
export function checkRole(context: PolicySessionContext, allowed: readonly UserRole[]): PolicyDecision {
  if (!isActive(context)) return { allowed: false, reason: "FORBIDDEN" };
  return allowed.some((role) => context.roles.includes(role)) ? { allowed: true } : { allowed: false, reason: "FORBIDDEN" };
}
