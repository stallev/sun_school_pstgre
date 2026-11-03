import { ACADEMIC_YEAR_STATUS, USER_ROLE } from "@sunschool/domain";
import { ALLOWED, isActive, type PolicyDecision, type PolicySessionContext } from "./context";

export type CanEditPupilBirthDateFacts = {
  pupilExistsInOrganization: boolean;
  teacherCanEditPupil: boolean;
  academicYearStatus: string;
};

const NOT_FOUND: PolicyDecision = { allowed: false, reason: "NOT_FOUND" };
const FORBIDDEN: PolicyDecision = { allowed: false, reason: "FORBIDDEN" };

/** AZ-20a, AZ-D4, AZ-P5 — teacher edits birth date only for pupils in the assigned active-year group. */
export function canEditPupilBirthDate(
  context: PolicySessionContext,
  facts: CanEditPupilBirthDateFacts,
): PolicyDecision {
  if (!isActive(context)) return FORBIDDEN;

  const isAdmin = context.roles.includes(USER_ROLE.ADMIN);
  const isTeacher = context.roles.includes(USER_ROLE.TEACHER);
  if (!isAdmin && !isTeacher) return FORBIDDEN;
  if (!facts.pupilExistsInOrganization) return NOT_FOUND;

  if (isAdmin) return ALLOWED;

  if (facts.academicYearStatus === ACADEMIC_YEAR_STATUS.CLOSED) return FORBIDDEN;
  return facts.teacherCanEditPupil ? ALLOWED : NOT_FOUND;
}
