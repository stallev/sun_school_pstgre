import "server-only";

import { updateTag } from "next/cache";

import {
  BOOKING_MUTATION_ERROR_CODES,
  BOOKING_STATUS,
  bookingOverlapsExisting,
  buildBookingSnapshots,
  createBookingInputSchema,
  generateAvailableSlots,
  getLocalDateRangeFromToday,
  TRAINER_STATUS,
  validateCreateBookingSlot,
  type CreateBookingInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma, isPrismaWriteConflict, Prisma } from "@pulse/db";
import { assertCanCreateBooking, PolicyError } from "@pulse/policy-server";

import {
  getUtcRangeForLocalDates,
  WIZARD_SLOT_DAY_COUNT,
} from "@/data/trainer/load-trainer-schedule-facts.server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { formatPrismaDate, formatPrismaTime } from "@/lib/trainer/schedule-time";

export type CreateBookingResult = MutationResult<{ id: string }>;

const TRANSACTION_RETRIES = 3;
const OVERLAP_LOOKBACK_MS = 4 * 60 * 60 * 1000;

function mapPolicyError(error: PolicyError, messages: Messages): CreateBookingResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.booking.errors.unauthorized,
    };
  }

  return {
    ok: false,
    code: BOOKING_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.booking.errors.forbidden,
  };
}

async function runCreateBookingTransaction(
  clientId: string,
  input: CreateBookingInput,
  messages: Messages,
): Promise<CreateBookingResult> {
  const prisma = getPrisma();
  const slotStart = new Date(input.startsAtUtc);

  return prisma.$transaction(
    async (tx) => {
      const service = await tx.trainerService.findFirst({
        where: {
          id: input.trainerServiceId,
          trainerProfileId: input.trainerProfileId,
        },
        select: {
          id: true,
          isActive: true,
          name: true,
          durationMinutes: true,
          priceCents: true,
          currency: true,
          trainerProfile: {
            select: {
              status: true,
              timezone: true,
              weeklyIntervals: {
                select: {
                  dayOfWeek: true,
                  startTime: true,
                  endTime: true,
                },
              },
              scheduleExceptions: {
                select: {
                  exceptionDate: true,
                  isBlocked: true,
                },
              },
            },
          },
        },
      });

      if (!service || service.trainerProfile.status !== TRAINER_STATUS.APPROVED) {
        return {
          ok: false,
          code: BOOKING_MUTATION_ERROR_CODES.TRAINER_NOT_BOOKABLE,
          message: messages.booking.errors.trainerNotBookable,
        };
      }

      if (!service.isActive) {
        return {
          ok: false,
          code: BOOKING_MUTATION_ERROR_CODES.SERVICE_INACTIVE,
          message: messages.booking.errors.serviceInactive,
        };
      }

      const timezone = service.trainerProfile.timezone;
      const range = getLocalDateRangeFromToday(
        timezone,
        WIZARD_SLOT_DAY_COUNT,
      );
      const { rangeEnd } = getUtcRangeForLocalDates(
        range.fromLocalDate,
        range.toLocalDate,
      );

      const existingBookings = await tx.booking.findMany({
        where: {
          trainerProfileId: input.trainerProfileId,
          status: { not: BOOKING_STATUS.CANCELLED },
          startsAt: {
            gte: new Date(slotStart.getTime() - OVERLAP_LOOKBACK_MS),
            lte: rangeEnd,
          },
        },
        select: {
          startsAt: true,
          durationMinutes: true,
        },
      });

      const bookingFacts = existingBookings.map((item) => ({
        startsAtUtc: item.startsAt.toISOString(),
        durationMinutes: item.durationMinutes,
      }));

      const allowlist = generateAvailableSlots({
        timezone,
        intervals: service.trainerProfile.weeklyIntervals.map((item) => ({
          dayOfWeek: item.dayOfWeek,
          startTime: formatPrismaTime(item.startTime),
          endTime: formatPrismaTime(item.endTime),
        })),
        exceptions: service.trainerProfile.scheduleExceptions.map((item) => ({
          exceptionDate: formatPrismaDate(item.exceptionDate),
          isBlocked: item.isBlocked,
        })),
        bookings: bookingFacts,
        range,
        slotDurationMinutes: service.durationMinutes,
      });

      const slotValidation = validateCreateBookingSlot(
        { startsAtUtc: input.startsAtUtc },
        allowlist,
      );

      if (slotValidation) {
        const message =
          slotValidation.code === BOOKING_MUTATION_ERROR_CODES.SLOT_IN_PAST
            ? messages.booking.errors.slotInPast
            : messages.booking.errors.slotUnavailable;

        return {
          ok: false,
          code: slotValidation.code,
          message,
        };
      }

      if (
        bookingOverlapsExisting(
          input.startsAtUtc,
          service.durationMinutes,
          bookingFacts,
        )
      ) {
        return {
          ok: false,
          code: BOOKING_MUTATION_ERROR_CODES.SLOT_UNAVAILABLE,
          message: messages.booking.errors.slotUnavailable,
        };
      }

      const snapshots = buildBookingSnapshots({
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        currency: service.currency,
      });

      const booking = await tx.booking.create({
        data: {
          clientId,
          trainerProfileId: input.trainerProfileId,
          trainerServiceId: input.trainerServiceId,
          status: BOOKING_STATUS.PENDING,
          startsAt: slotStart,
          durationMinutes: snapshots.durationMinutes,
          priceCents: snapshots.priceCents,
          currency: snapshots.currency,
          serviceNameSnapshot: snapshots.serviceNameSnapshot,
          clientMessage: input.clientMessage ?? null,
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: clientId,
          action: "booking.created",
          targetType: "booking",
          targetId: booking.id,
        },
      });

      return { ok: true, data: { id: booking.id } };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );
}

export async function createBookingMutation(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const messages = await getMessages();
  const parsed = createBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.booking.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();

  try {
    assertCanCreateBooking(ctx);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  for (let attempt = 0; attempt < TRANSACTION_RETRIES; attempt += 1) {
    try {
      return await runCreateBookingTransaction(
        ctx.userId,
        parsed.data,
        messages,
      );
    } catch (error) {
      if (isPrismaWriteConflict(error) && attempt < TRANSACTION_RETRIES - 1) {
        continue;
      }

      throw error;
    }
  }

  return {
    ok: false,
    code: BOOKING_MUTATION_ERROR_CODES.SLOT_UNAVAILABLE,
    message: messages.booking.errors.slotUnavailable,
  };
}

async function invalidateBookingCreatedCache(
  trainerProfileId: string,
  bookingId: string,
): Promise<void> {
  const ctx = await getPolicySessionContext();
  if (ctx) {
    updateTag(CACHE_TAGS.bookingsClient(ctx.userId));
  }
  updateTag(CACHE_TAGS.booking(bookingId));
  updateTag(CACHE_TAGS.trainer(trainerProfileId));
}

export async function createBookingWithCacheInvalidation(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
    const result = await createBookingMutation(input);

  if (result.ok) {
    await invalidateBookingCreatedCache(input.trainerProfileId, result.data.id);
  }

  return result;
}
