import "server-only";

import { updateTag } from "next/cache";

import {
  BOOKING_MUTATION_ERROR_CODES,
  BOOKING_STATUS,
  completeBookingInputSchema,
  validateCompleteBooking,
  type CompleteBookingInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanCompleteBooking,
  PolicyError,
} from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type CompleteBookingResult = MutationResult<{ id: string; status: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): CompleteBookingResult {
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
): CompleteBookingResult {
  switch (code) {
    case BOOKING_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION:
    case BOOKING_MUTATION_ERROR_CODES.BOOKING_TERMINAL:
      return {
        ok: false,
        code,
        message: messages.booking.errors.terminal,
      };
    case BOOKING_MUTATION_ERROR_CODES.BOOKING_STATE_CONFLICT:
      return {
        ok: false,
        code,
        message: messages.booking.errors.stateConflict,
      };
    default:
      return {
        ok: false,
        code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.booking.errors.validation,
      };
  }
}

async function runCompleteBookingTransaction(
  actorUserId: string,
  bookingId: string,
  messages: Messages,
): Promise<CompleteBookingResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        clientId: true,
        trainerProfileId: true,
        trainerProfile: {
          select: { userId: true },
        },
      },
    });

    if (!booking) {
      return {
        ok: false,
        code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.booking.errors.validation,
      };
    }

    const validation = validateCompleteBooking({ status: booking.status });
    if (validation) {
      return mapValidationError(validation.code, messages);
    }

    const update = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: BOOKING_STATUS.CONFIRMED,
      },
      data: {
        status: BOOKING_STATUS.COMPLETED,
        completedAt: new Date(),
        completedById: actorUserId,
      },
    });

    if (update.count === 0) {
      const current = await tx.booking.findFirst({
        where: { id: bookingId },
        select: { status: true },
      });

      if (current?.status === BOOKING_STATUS.COMPLETED) {
        return {
          ok: true,
          data: { id: bookingId, status: BOOKING_STATUS.COMPLETED },
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
        action: "booking.completed",
        targetType: "booking",
        targetId: bookingId,
      },
    });

    return {
      ok: true,
      data: { id: bookingId, status: BOOKING_STATUS.COMPLETED },
    };
  });
}

export async function completeBookingMutation(
  input: CompleteBookingInput,
): Promise<CompleteBookingResult> {
  const messages = await getMessages();
  const parsed = completeBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.booking.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.booking.errors.unauthorized,
    };
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.bookingId },
    select: {
      trainerProfile: { select: { userId: true } },
    },
  });

  if (!booking) {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.booking.errors.validation,
    };
  }

  try {
    assertCanCompleteBooking(ctx, {
      trainerOwnerUserId: booking.trainerProfile.userId,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  return runCompleteBookingTransaction(ctx.userId, parsed.data.bookingId, messages);
}

async function invalidateCompleteBookingCache(bookingId: string): Promise<void> {
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    select: { clientId: true, trainerProfileId: true },
  });

  if (!booking) {
    return;
  }

  updateTag(CACHE_TAGS.booking(bookingId));
  updateTag(CACHE_TAGS.bookingsClient(booking.clientId));
  updateTag(CACHE_TAGS.trainer(booking.trainerProfileId));
  updateTag(CACHE_TAGS.bookingsTrainer(booking.trainerProfileId));
}

export async function completeBookingWithCacheInvalidation(
  input: CompleteBookingInput,
): Promise<CompleteBookingResult> {
    const result = await completeBookingMutation(input);

  if (result.ok) {
    await invalidateCompleteBookingCache(result.data.id);
  }

  return result;
}
