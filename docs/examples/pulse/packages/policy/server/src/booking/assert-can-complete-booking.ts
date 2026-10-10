import { USER_ROLE, type PolicySessionContext } from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export type CompleteBookingPolicyFacts = {
  trainerOwnerUserId: string;
};

export function assertCanCompleteBooking(
  ctx: PolicySessionContext | null,
  facts: CompleteBookingPolicyFacts,
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
