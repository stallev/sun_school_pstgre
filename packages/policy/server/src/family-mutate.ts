import { USER_ROLE } from "@sunschool/domain";
import { ALLOWED, isActive, type PolicyDecision, type PolicySessionContext } from "./context";

export type CanMutateFamilyFacts = {
  familyExistsInOrganization: boolean;
};

const NOT_FOUND: PolicyDecision = { allowed: false, reason: "NOT_FOUND" };
const FORBIDDEN: PolicyDecision = { allowed: false, reason: "FORBIDDEN" };

/** AZ-58, AZ-D4 — family mutations are admin-only; foreign family → NOT_FOUND. */
export function canMutateFamily(
  context: PolicySessionContext,
  facts: CanMutateFamilyFacts,
): PolicyDecision {
  if (!isActive(context) || !context.roles.includes(USER_ROLE.ADMIN)) return FORBIDDEN;
  if (!facts.familyExistsInOrganization) return NOT_FOUND;
  return ALLOWED;
}

/** AZ-58 — create family (no row yet) is still admin-only. */
export function canCreateFamily(context: PolicySessionContext): PolicyDecision {
  if (!isActive(context) || !context.roles.includes(USER_ROLE.ADMIN)) return FORBIDDEN;
  return ALLOWED;
}
