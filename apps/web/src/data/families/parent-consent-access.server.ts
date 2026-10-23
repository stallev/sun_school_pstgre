import "server-only";

import {
  MUTATION_ERROR_CODES,
  type MutationErr,
  type MutationResult,
  type UserRole,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { canMutateOwnChildConsent } from "@sunschool/policy-server";
import { assertParentsFeatureOn } from "./family-mutate-access.server";

type Tx = Prisma.TransactionClient;

async function loadPolicySessionContext(tx: Tx, actorUserId: string) {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: {
      id: true,
      status: true,
      organizationId: true,
      roles: { select: { role: true } },
    },
  });
  if (!user) {
    return { context: null, organizationId: null };
  }
  return {
    context: {
      userId: user.id,
      status: user.status,
      roles: user.roles.map((row) => row.role) as UserRole[],
    },
    organizationId: user.organizationId,
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

export type ParentGuardianAccess = {
  organizationId: string;
  guardianAdultId: string;
};

export async function loadParentGuardianForPupil(
  tx: Tx,
  actorUserId: string,
  pupilId: string,
): Promise<MutationResult<ParentGuardianAccess>> {
  const flagError = await assertParentsFeatureOn(tx);
  if (flagError) return flagError;

  const { context, organizationId } = await loadPolicySessionContext(tx, actorUserId);
  if (!context || !organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await tx.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { id: true, familyId: true },
  });

  const adult =
    pupil?.familyId === null || pupil?.familyId === undefined
      ? null
      : await tx.familyAdult.findFirst({
          where: { userId: actorUserId, familyId: pupil.familyId },
          select: { id: true },
        });

  const decision = canMutateOwnChildConsent(context, {
    pupilInOrganization: Boolean(pupil),
    isOwnChild: Boolean(adult),
  });
  if (!decision.allowed) return policyToMutation(decision);

  return { ok: true, data: { organizationId, guardianAdultId: adult!.id } };
}
