import { USER_ROLE } from "@sunschool/domain";
import { ALLOWED, isActive, type PolicyDecision, type PolicySessionContext } from "./context";

export type CanAwardManuallyFacts = {
  pupilExistsInOrganization: boolean;
  teacherCanAccessPupil: boolean;
};

const NOT_FOUND: PolicyDecision = { allowed: false, reason: "NOT_FOUND" };
const FORBIDDEN: PolicyDecision = { allowed: false, reason: "FORBIDDEN" };

const hasAwardRole = (context: PolicySessionContext): boolean =>
  context.roles.includes(USER_ROLE.ADMIN) || context.roles.includes(USER_ROLE.TEACHER);

/** AZ-53, AZ-D4 — manual award; teacher only for reachable pupils; admin any. */
export function canAwardManually(
  context: PolicySessionContext,
  facts: CanAwardManuallyFacts,
): PolicyDecision {
  if (!isActive(context) || !hasAwardRole(context)) return FORBIDDEN;
  if (!facts.pupilExistsInOrganization) return NOT_FOUND;

  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;

  return facts.teacherCanAccessPupil ? ALLOWED : NOT_FOUND;
}

/** AZ-54 — revoke only admin; teacher is forbidden (not masked as not found). */
export function canRevokeAward(context: PolicySessionContext): PolicyDecision {
  if (!isActive(context)) return FORBIDDEN;
  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;
  if (context.roles.includes(USER_ROLE.TEACHER)) return FORBIDDEN;
  return FORBIDDEN;
}
