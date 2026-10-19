import { USER_ROLE } from "@sunschool/domain";
import { ALLOWED, isActive, type PolicyDecision, type PolicySessionContext } from "./context";

export type CanViewGroupYearFacts = {
  gradeExistsInOrganization: boolean;
  teacherAssignedToGradeInYear: boolean;
};

export type CanViewPupilYearsFacts = {
  pupilExistsInOrganization: boolean;
  teacherCanAccessPupil: boolean;
};

const NOT_FOUND: PolicyDecision = { allowed: false, reason: "NOT_FOUND" };
const FORBIDDEN: PolicyDecision = { allowed: false, reason: "FORBIDDEN" };

const hasAnalyticsRole = (context: PolicySessionContext): boolean =>
  context.roles.includes(USER_ROLE.ADMIN) || context.roles.includes(USER_ROLE.TEACHER);

/** AZ-48, AZ-D4 — group year analytics; teacher only in assigned years; admin any year. */
export function canViewGroupYear(
  context: PolicySessionContext,
  facts: CanViewGroupYearFacts,
): PolicyDecision {
  if (!isActive(context) || !hasAnalyticsRole(context)) return FORBIDDEN;
  if (!facts.gradeExistsInOrganization) return NOT_FOUND;

  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;

  return facts.teacherAssignedToGradeInYear ? ALLOWED : NOT_FOUND;
}

/** AZ-49, AZ-50, AZ-D4 — pupil year rows when pupil is reachable under AZ-45 (all years). */
export function canViewPupilYears(
  context: PolicySessionContext,
  facts: CanViewPupilYearsFacts,
): PolicyDecision {
  if (!isActive(context) || !hasAnalyticsRole(context)) return FORBIDDEN;
  if (!facts.pupilExistsInOrganization) return NOT_FOUND;

  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;

  return facts.teacherCanAccessPupil ? ALLOWED : NOT_FOUND;
}
