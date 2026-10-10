import {
  TRAINER_STATUS,
  USER_ROLE,
  type PolicySessionContext,
  type TrainerStatus,
} from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export type TrainerProfilePolicyFacts = {
  userId: string;
  status: TrainerStatus;
};

export function assertCanMutateTrainerProfile(
  ctx: PolicySessionContext | null,
  facts?: TrainerProfilePolicyFacts,
): asserts ctx is PolicySessionContext {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  if (ctx.role !== USER_ROLE.TRAINER) {
    throw new PolicyError("FORBIDDEN");
  }

  if (!facts) {
    return;
  }

  if (facts.userId !== ctx.userId) {
    throw new PolicyError("FORBIDDEN");
  }

  if (
    facts.status !== TRAINER_STATUS.PENDING &&
    facts.status !== TRAINER_STATUS.REJECTED
  ) {
    throw new PolicyError("FORBIDDEN");
  }
}
