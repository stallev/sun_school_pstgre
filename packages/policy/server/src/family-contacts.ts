import { USER_ROLE } from "@sunschool/domain";
import { ALLOWED, isActive, type PolicyDecision, type PolicySessionContext } from "./context";

export type CanListFamilyContactsFacts = {
  pupilExistsInOrganization: boolean;
  teacherCanAccessPupil: boolean;
};

const NOT_FOUND: PolicyDecision = { allowed: false, reason: "NOT_FOUND" };
const FORBIDDEN: PolicyDecision = { allowed: false, reason: "FORBIDDEN" };

/** AZ-63, AZ-D4 — family contacts on a pupil card; teacher only for reachable pupils. */
export function canListFamilyContacts(
  context: PolicySessionContext,
  facts: CanListFamilyContactsFacts,
): PolicyDecision {
  if (!isActive(context)) return FORBIDDEN;
  if (!facts.pupilExistsInOrganization) return NOT_FOUND;

  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;

  if (context.roles.includes(USER_ROLE.TEACHER)) {
    return facts.teacherCanAccessPupil ? ALLOWED : NOT_FOUND;
  }

  return FORBIDDEN;
}
