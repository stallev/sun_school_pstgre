import "server-only";

import { USER_ROLE, type PolicySessionContext } from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";
import {
  assertCanReadBooking,
  type BookingPolicyFacts,
} from "../booking/assert-can-read-booking";

export async function assertCanPublishReview(
  ctx: PolicySessionContext | null,
  bookingId: string,
): Promise<BookingPolicyFacts> {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  if (ctx.role !== USER_ROLE.CLIENT) {
    throw new PolicyError("FORBIDDEN");
  }

  return assertCanReadBooking(ctx, bookingId);
}
