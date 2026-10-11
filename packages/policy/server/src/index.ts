import type { AccountStatus, UserRole } from "@sunschool/domain";

/**
 * Session context for object-level checks. Built by requireActiveUser() in apps/web from the DB —
 * never from the JWT alone, and never from next-auth types.
 */
export type PolicySessionContext = {
  userId: string;
  status: AccountStatus;
  roles: readonly UserRole[];
};

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: "FORBIDDEN" | "NOT_FOUND" };

/**
 * Stub — AZ-matrix checks (authorization_matrix.md §4) arrive with the use-cases that need them
 * (P01-CU5 and later). Policy functions are pure: no redirect(), no notFound().
 */
export function allow(): PolicyDecision {
  return { allowed: true };
}
