import "server-only";

import { updateTag } from "next/cache";

import {
  BOOKING_MUTATION_ERROR_CODES,
  BOOKING_STATUS,
  cancelBookingInputSchema,
  validateClientCancelBooking,
  type CancelBookingInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanCancelBooking,
  PolicyError,
} from "@pulse/policy-server";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";


export type CancelBookingResult = MutationResult<{ id: string; status: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): CancelBookingResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.booking.errors.unauthorized,
    };
  }

  if (error.code === "NOT_FOUND") {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.booking.errors.validation,
    };
  }

  return {
    ok: false,
    code: BOOKING_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.booking.errors.forbidden,
  };
}

function mapValidationError(
  code: (typeof BOOKING_MUTATION_ERROR_CODES)[keyof typeof BOOKING_MUTATION_ERROR_CODES],
  messages: Messages,
): CancelBookingResult {
  switch (code) {
    case BOOKING_MUTATION_ERROR_CODES.CANCELLATION_WINDOW_CLOSED:
      return {
        ok: false,
        code,
        message: messages.booking.errors.cancellationWindowClosed,
      };
    case BOOKING_MUTATION_ERROR_CODES.BOOKING_STATE_CONFLICT:
      return {
        ok: false,
        code,
        message: messages.booking.errors.stateConflict,
      };
    case BOOKING_MUTATION_ERROR_CODES.BOOKING_TERMINAL:
      return {
        ok: false,
        code,
        message: messages.booking.errors.terminal,
      };
    case BOOKING_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION:
      return {
        ok: false,
        code,
        message: messages.booking.errors.terminal,
      };
    default:
      return {
        ok: false,
        code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.booking.errors.genericCancel,
      };
  }
}

async function runCancelBookingTransaction(
  actorUserId: string,
  bookingId: string,
  messages: Messages,
): Promise<CancelBookingResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, clientId: actorUserId },
      select: {
        id: true,
        status: true,
        startsAt: true,
        trainerProfileId: true,
      },
    });

    if (!booking) {
      return {
        ok: false,
        code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.booking.errors.validation,
      };
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return {
        ok: true,
        data: { id: booking.id, status: BOOKING_STATUS.CANCELLED },
      };
    }

    const validation = validateClientCancelBooking({
      status: booking.status,
      startsAtUtc: booking.startsAt.toISOString(),
    });

    if (validation) {
      return mapValidationError(validation.code, messages);
    }

    const update = await tx.booking.updateMany({
      where: {
        id: bookingId,
        clientId: actorUserId,
        status: {
          in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED],
        },
      },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelledAt: new Date(),
        cancelledById: actorUserId,
      },
    });

    if (update.count === 0) {
      const current = await tx.booking.findFirst({
        where: { id: bookingId },
        select: { status: true },
      });

      if (current?.status === BOOKING_STATUS.CANCELLED) {
        return {
          ok: true,
          data: { id: bookingId, status: BOOKING_STATUS.CANCELLED },
        };
      }

      return mapValidationError(
        BOOKING_MUTATION_ERROR_CODES.BOOKING_STATE_CONFLICT,
        messages,
      );
    }

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "booking.cancelled",
        targetType: "booking",
        targetId: bookingId,
      },
    });

    return {
      ok: true,
      data: { id: bookingId, status: BOOKING_STATUS.CANCELLED },
    };
  });
}

export async function cancelBookingMutation(
  input: CancelBookingInput,
): Promise<CancelBookingResult> {
  const messages = await getMessages();
  const parsed = cancelBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.booking.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();

  try {
    await assertCanCancelBooking(ctx, parsed.data.bookingId);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  if (!ctx) {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.booking.errors.unauthorized,
    };
  }

  return runCancelBookingTransaction(ctx.userId, parsed.data.bookingId, messages);
}

async function invalidateBookingCancelledCache(
  bookingId: string,
  clientUserId: string,
): Promise<void> {
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    select: { trainerProfileId: true },
  });

  updateTag(CACHE_TAGS.bookingsClient(clientUserId));
  updateTag(CACHE_TAGS.booking(bookingId));

  if (booking) {
    updateTag(CACHE_TAGS.trainer(booking.trainerProfileId));
  }
}

export async function cancelBookingWithCacheInvalidation(
  input: CancelBookingInput,
): Promise<CancelBookingResult> {
    const ctx = await getPolicySessionContext();
  const result = await cancelBookingMutation(input);

  if (result.ok && ctx) {
    await invalidateBookingCancelledCache(result.data.id, ctx.userId);
  }

  return result;
}
