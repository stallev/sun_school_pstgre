import { USER_ROLE, type PolicySessionContext } from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export type TrainerClientPolicyFacts = {
  trainerOwnerUserId: string;
};

export function assertCanAccessTrainerClient(
  ctx: PolicySessionContext | null,
  facts: TrainerClientPolicyFacts,
): asserts ctx is PolicySessionContext {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  if (ctx.role !== USER_ROLE.TRAINER) {
    throw new PolicyError("FORBIDDEN");
  }

  if (facts.trainerOwnerUserId !== ctx.userId) {
    throw new PolicyError("FORBIDDEN");
  }
}

export function assertCanUpsertTrainerClientNote(
  ctx: PolicySessionContext | null,
  facts: TrainerClientPolicyFacts,
): asserts ctx is PolicySessionContext {
  assertCanAccessTrainerClient(ctx, facts);
}
