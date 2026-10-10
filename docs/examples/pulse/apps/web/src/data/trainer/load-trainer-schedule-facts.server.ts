import "server-only";

import {
  BOOKING_STATUS,
  generateAvailableSlots,
  getLocalDateRangeFromToday,
  TRAINER_STATUS,
  type SlotDto,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { BOOKING_WIZARD_SLOT_DAY_COUNT } from "@/lib/booking/booking-wizard-utils";
import { formatPrismaDate, formatPrismaTime } from "@/lib/trainer/schedule-time";

export type TrainerScheduleFacts = {
  timezone: string;
  intervals: { dayOfWeek: number; startTime: string; endTime: string }[];
  exceptions: { exceptionDate: string; isBlocked: boolean }[];
};

export async function loadTrainerScheduleFacts(
  trainerProfileId: string,
): Promise<TrainerScheduleFacts | null> {
  const prisma = getPrisma();
  const profile = await prisma.trainerProfile.findFirst({
    where: {
      id: trainerProfileId,
      status: TRAINER_STATUS.APPROVED,
    },
    select: {
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
  });

  if (!profile) {
    return null;
  }

  return {
    timezone: profile.timezone,
    intervals: profile.weeklyIntervals.map((item) => ({
      dayOfWeek: item.dayOfWeek,
      startTime: formatPrismaTime(item.startTime),
      endTime: formatPrismaTime(item.endTime),
    })),
    exceptions: profile.scheduleExceptions.map((item) => ({
      exceptionDate: formatPrismaDate(item.exceptionDate),
      isBlocked: item.isBlocked,
    })),
  };
}

export async function loadTrainerBookingsForRange(
  trainerProfileId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<{ startsAtUtc: string; durationMinutes: number }[]> {
  const prisma = getPrisma();
  const bookings = await prisma.booking.findMany({
    where: {
      trainerProfileId,
      status: { not: BOOKING_STATUS.CANCELLED },
      startsAt: { gte: rangeStart, lte: rangeEnd },
    },
    select: {
      startsAt: true,
      durationMinutes: true,
    },
  });

  return bookings.map((item) => ({
    startsAtUtc: item.startsAt.toISOString(),
    durationMinutes: item.durationMinutes,
  }));
}

export function generateSlotsForTrainer(
  facts: TrainerScheduleFacts,
  bookings: { startsAtUtc: string; durationMinutes: number }[],
  slotDurationMinutes: number,
  dayCount: number,
  now = new Date(),
): SlotDto[] {
  const range = getLocalDateRangeFromToday(facts.timezone, dayCount, now);

  return generateAvailableSlots({
    timezone: facts.timezone,
    intervals: facts.intervals,
    exceptions: facts.exceptions,
    bookings,
    range,
    slotDurationMinutes,
    now,
  });
}

export { BOOKING_WIZARD_SLOT_DAY_COUNT as WIZARD_SLOT_DAY_COUNT };

export function getUtcRangeForLocalDates(
  fromLocalDate: string,
  toLocalDate: string,
): { rangeStart: Date; rangeEnd: Date } {
  return {
    rangeStart: new Date(`${fromLocalDate}T00:00:00.000Z`),
    rangeEnd: new Date(`${toLocalDate}T23:59:59.999Z`),
  };
}
