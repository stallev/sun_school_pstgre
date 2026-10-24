import { ACADEMIC_YEAR_STATUS, USER_ROLE } from "@sunschool/domain";
import { ALLOWED, isActive, type PolicyDecision, type PolicySessionContext } from "./context";

export type CanSetGroupAchievementModeFacts = {
  gradeExistsInOrganization: boolean;
  teacherAssignedToGradeInYear: boolean;
};

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

/** AZ-55, AZ-D4 — group achievement mode; teacher only assigned grade in year; admin any. */
export function canSetGroupAchievementMode(
  context: PolicySessionContext,
  facts: CanSetGroupAchievementModeFacts,
): PolicyDecision {
  if (!isActive(context) || !hasAwardRole(context)) return FORBIDDEN;
  if (!facts.gradeExistsInOrganization) return NOT_FOUND;

  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;

  return facts.teacherAssignedToGradeInYear ? ALLOWED : NOT_FOUND;
}

export type CanSetGroupAchievementPointsFacts = CanSetGroupAchievementModeFacts & {
  academicYearStatus: string;
};

/** AZ-65 — group achievement points; teacher only assigned grade in active year; admin any year. */
export function canSetGroupAchievementPoints(
  context: PolicySessionContext,
  facts: CanSetGroupAchievementPointsFacts,
): PolicyDecision {
  const base = canSetGroupAchievementMode(context, facts);
  if (!base.allowed) return base;

  const isTeacherOnly =
    context.roles.includes(USER_ROLE.TEACHER) && !context.roles.includes(USER_ROLE.ADMIN);
  if (isTeacherOnly && facts.academicYearStatus === ACADEMIC_YEAR_STATUS.CLOSED) {
    return { allowed: false, reason: "YEAR_CLOSED" };
  }
  return ALLOWED;
}

export type CanCopyGroupAchievementPointsFacts = {
  target: CanSetGroupAchievementPointsFacts;
  sourceGradeExistsInOrganization: boolean;
  teacherAssignedToSourceGradeInYear: boolean;
};

/** AZ-65 — copy group points; actor must reach source and target grades. */
export function canCopyGroupAchievementPoints(
  context: PolicySessionContext,
  facts: CanCopyGroupAchievementPointsFacts,
): PolicyDecision {
  const targetDecision = canSetGroupAchievementPoints(context, facts.target);
  if (!targetDecision.allowed) return targetDecision;

  if (!facts.sourceGradeExistsInOrganization) return NOT_FOUND;

  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;

  return facts.teacherAssignedToSourceGradeInYear ? ALLOWED : NOT_FOUND;
}

/** AZ-54 — revoke only admin; teacher is forbidden (not masked as not found). */
export function canRevokeAward(context: PolicySessionContext): PolicyDecision {
  if (!isActive(context)) return FORBIDDEN;
  if (context.roles.includes(USER_ROLE.ADMIN)) return ALLOWED;
  if (context.roles.includes(USER_ROLE.TEACHER)) return FORBIDDEN;
  return FORBIDDEN;
}
