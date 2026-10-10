import { USER_ROLE, type PolicySessionContext } from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export function assertCanCreateBooking(
  ctx: PolicySessionContext | null,
): asserts ctx is PolicySessionContext {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  if (ctx.role !== USER_ROLE.CLIENT) {
    throw new PolicyError("FORBIDDEN");
  }
}
