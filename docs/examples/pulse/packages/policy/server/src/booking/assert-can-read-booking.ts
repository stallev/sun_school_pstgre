import "server-only";

import {
  USER_ROLE,
  type BookingStatus,
  type PolicySessionContext,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { PolicyError } from "../errors/policy-error";

export type BookingPolicyFacts = {
  id: string;
  clientId: string;
  trainerProfileId: string;
  status: BookingStatus;
  startsAtUtc: string;
};

export async function assertCanReadBooking(
  ctx: PolicySessionContext | null,
  bookingId: string,
): Promise<BookingPolicyFacts> {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    select: {
      id: true,
      clientId: true,
      trainerProfileId: true,
      status: true,
      startsAt: true,
    },
  });

  if (!booking || booking.clientId !== ctx.userId) {
    throw new PolicyError("NOT_FOUND");
  }

  return {
    id: booking.id,
    clientId: booking.clientId,
    trainerProfileId: booking.trainerProfileId,
    status: booking.status,
    startsAtUtc: booking.startsAt.toISOString(),
  };
}

export async function assertCanCancelBooking(
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
