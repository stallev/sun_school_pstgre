import { USER_ROLE, type PolicySessionContext } from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export type TrainerProfileEditPolicyFacts = {
  userId: string;
};

export function assertCanEditTrainerProfile(
  ctx: PolicySessionContext | null,
  facts: TrainerProfileEditPolicyFacts,
): asserts ctx is PolicySessionContext {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  if (ctx.role !== USER_ROLE.TRAINER) {
    throw new PolicyError("FORBIDDEN");
  }

  if (facts.userId !== ctx.userId) {
    throw new PolicyError("FORBIDDEN");
  }
}
