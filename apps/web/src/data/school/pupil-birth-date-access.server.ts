import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  type MutationErr,
  type UserRole,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { canEditPupilBirthDate } from "@sunschool/policy-server";

type Tx = Prisma.TransactionClient;

async function loadPolicySessionContext(tx: Tx, actorUserId: string) {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: {
      id: true,
      status: true,
      roles: { select: { role: true } },
    },
  });
  if (!user) {
    return {
      userId: actorUserId,
      status: ACCOUNT_STATUS.DISABLED,
      roles: [] as UserRole[],
    };
  }
  return {
    userId: user.id,
    status: user.status,
    roles: user.roles.map((row) => row.role),
  };
}

function policyToMutation(
  decision: { allowed: boolean; reason?: string },
  facts: { academicYearStatus: string },
  roles: UserRole[],
): MutationErr {
  const isTeacherOnly =
    roles.includes(USER_ROLE.TEACHER) && !roles.includes(USER_ROLE.ADMIN);
  if (
    !decision.allowed &&
    isTeacherOnly &&
    facts.academicYearStatus === ACADEMIC_YEAR_STATUS.CLOSED
  ) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.year_closed",
    };
  }
  return {
    ok: false,
    code:
      decision.reason === "FORBIDDEN"
        ? MUTATION_ERROR_CODES.FORBIDDEN
        : MUTATION_ERROR_CODES.NOT_FOUND,
    message:
      decision.reason === "FORBIDDEN"
        ? "common.errors.forbidden"
        : "common.errors.not_found",
  };
}

export async function loadPupilBirthDateAccessFacts(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
) {
  const pupil = await tx.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { id: true },
  });

  const activeYear = await tx.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, status: true },
  });

  let teacherCanEditPupil = false;
  if (activeYear) {
    const enrollment = await tx.enrollment.findFirst({
      where: { pupilId, academicYearId: activeYear.id, endsOn: null },
      select: { gradeId: true },
    });
    if (enrollment) {
      const assigned = await tx.teacherAssignment.findFirst({
        where: {
          userId: actorUserId,
          gradeId: enrollment.gradeId,
          academicYearId: activeYear.id,
        },
        select: { id: true },
      });
      teacherCanEditPupil = assigned !== null;
    }
  }

  return {
    pupilExistsInOrganization: Boolean(pupil),
    teacherCanEditPupil,
    academicYearStatus: activeYear?.status ?? ACADEMIC_YEAR_STATUS.CLOSED,
  };
}

export async function assertPupilBirthDateAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
): Promise<MutationErr | null> {
  const session = await loadPolicySessionContext(tx, actorUserId);
  const facts = await loadPupilBirthDateAccessFacts(tx, actorUserId, organizationId, pupilId);
  const decision = canEditPupilBirthDate(session, facts);
  if (!decision.allowed) return policyToMutation(decision, facts, session.roles);
  return null;
}
