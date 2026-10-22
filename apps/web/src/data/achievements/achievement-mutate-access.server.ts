import "server-only";

import {
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  type MutationErr,
  type UserRole,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { canAwardManually, canRevokeAward } from "@sunschool/policy-server";
import { teacherCanAccessPupilForAnalytics } from "../analytics/years/year-analytics-access.server";

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

function policyToMutation(decision: { allowed: boolean; reason?: string }): MutationErr {
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

export async function assertAwardManuallyAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
): Promise<MutationErr | null> {
  const pupil = await tx.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { id: true },
  });
  const teacherCanAccess = await teacherCanAccessPupilForAnalytics(
    tx,
    actorUserId,
    organizationId,
    pupilId,
  );

  const decision = canAwardManually(await loadPolicySessionContext(tx, actorUserId), {
    pupilExistsInOrganization: Boolean(pupil),
    teacherCanAccessPupil: teacherCanAccess,
  });

  if (!decision.allowed) return policyToMutation(decision);
  return null;
}

export async function assertRevokeAwardAccess(
  tx: Tx,
  actorUserId: string,
): Promise<MutationErr | null> {
  const decision = canRevokeAward(await loadPolicySessionContext(tx, actorUserId));
  if (!decision.allowed) return policyToMutation(decision);
  return null;
}
