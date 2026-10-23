import { USER_ROLE } from "@sunschool/domain";
import { ALLOWED, isActive, type PolicyDecision, type PolicySessionContext } from "./context";

export type CanMutateOwnChildConsentFacts = {
  pupilInOrganization: boolean;
  isOwnChild: boolean;
};

const NOT_FOUND: PolicyDecision = { allowed: false, reason: "NOT_FOUND" };
const FORBIDDEN: PolicyDecision = { allowed: false, reason: "FORBIDDEN" };

/** AZ-61, AZ-D4 — parent electronic consent only for own child; foreign pupil → NOT_FOUND. */
export function canMutateOwnChildConsent(
  context: PolicySessionContext,
  facts: CanMutateOwnChildConsentFacts,
): PolicyDecision {
  if (!isActive(context) || !context.roles.includes(USER_ROLE.PARENT)) return FORBIDDEN;
  if (!facts.pupilInOrganization || !facts.isOwnChild) return NOT_FOUND;
  return ALLOWED;
}
