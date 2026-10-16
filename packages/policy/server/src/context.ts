import { ACCOUNT_STATUS, type AccountStatus, type UserRole } from "@sunschool/domain";

/**
 * Session context for object-level checks. Built by `requireActiveUser()` in apps/web from the DB —
 * never from the JWT alone, and never from next-auth types (typescript-monorepo-types).
 */
export type PolicySessionContext = {
  userId: string;
  status: AccountStatus;
  roles: readonly UserRole[];
};

/** Policy functions are pure: a decision, never `redirect()` or `notFound()` (policy-packages). */
export type PolicyDecision = { allowed: true } | { allowed: false; reason: "FORBIDDEN" | "NOT_FOUND" };

export const ALLOWED: PolicyDecision = { allowed: true };

export const isActive = (context: Pick<PolicySessionContext, "status">): boolean =>
  context.status === ACCOUNT_STATUS.ACTIVE;
