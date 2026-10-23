import "server-only";

import {
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  type MutationErr,
  type UserRole,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { canCreateFamily, canMutateFamily } from "@sunschool/policy-server";
import { readFeaturesParentsEnabled } from "./family-feature.server";

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

export async function assertParentsFeatureOn(tx: Tx): Promise<MutationErr | null> {
  const flagOn = await readFeaturesParentsEnabled(tx);
  if (!flagOn) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.FAMILY_FLAG_OFF,
      message: "parent.flag_off",
    };
  }
  return null;
}

export async function assertFamilyMutateAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  familyId: string,
): Promise<MutationErr | null> {
  const flagError = await assertParentsFeatureOn(tx);
  if (flagError) return flagError;

  const context = await loadPolicySessionContext(tx, actorUserId);
  const roleGate = canMutateFamily(context, { familyExistsInOrganization: true });
  if (!roleGate.allowed && roleGate.reason === "FORBIDDEN") {
    return policyToMutation(roleGate);
  }

  const family = await tx.family.findFirst({
    where: { id: familyId, organizationId },
    select: { id: true },
  });

  const decision = canMutateFamily(context, {
    familyExistsInOrganization: Boolean(family),
  });
  if (!decision.allowed) return policyToMutation(decision);
  return null;
}

export async function assertFamilyCreateAccess(
  tx: Tx,
  actorUserId: string,
): Promise<MutationErr | null> {
  const flagError = await assertParentsFeatureOn(tx);
  if (flagError) return flagError;

  const decision = canCreateFamily(await loadPolicySessionContext(tx, actorUserId));
  if (!decision.allowed) return policyToMutation(decision);
  return null;
}
