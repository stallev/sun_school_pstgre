import { USER_ROLE, type PolicySessionContext } from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export type TrainerServicePolicyFacts = {
  ownerUserId: string;
};

export function assertCanMutateTrainerService(
  ctx: PolicySessionContext | null,
  facts: TrainerServicePolicyFacts,
): asserts ctx is PolicySessionContext {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  if (ctx.role !== USER_ROLE.TRAINER) {
    throw new PolicyError("FORBIDDEN");
  }

  if (facts.ownerUserId !== ctx.userId) {
    throw new PolicyError("FORBIDDEN");
  }
}
