import { Temporal } from "@js-temporal/polyfill";

import { BOOKING_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { CreateBookingInput } from "../schemas/create-booking";
import type { SlotDto } from "../types/slot-dto";

export type BookingServiceSnapshotSource = {
  name: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
};

export type BookingSnapshots = {
  serviceNameSnapshot: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
};

export type CreateBookingValidationError = {
  code: (typeof BOOKING_MUTATION_ERROR_CODES)[keyof typeof BOOKING_MUTATION_ERROR_CODES];
};

export function buildBookingSnapshots(
  service: BookingServiceSnapshotSource,
): BookingSnapshots {
  return {
    serviceNameSnapshot: service.name,
    durationMinutes: service.durationMinutes,
    priceCents: service.priceCents,
    currency: service.currency,
  };
}

export function isSlotAllowed(
  startsAtUtc: string,
  allowlist: SlotDto[],
): boolean {
  return allowlist.some((slot) => slot.startsAtUtc === startsAtUtc);
}

export function validateSlotNotInPast(
  startsAtUtc: string,
  now = new Date(),
): CreateBookingValidationError | null {
  const slotInstant = Temporal.Instant.from(startsAtUtc);
  const nowInstant = Temporal.Instant.from(now.toISOString());

  if (Temporal.Instant.compare(slotInstant, nowInstant) <= 0) {
    return { code: BOOKING_MUTATION_ERROR_CODES.SLOT_IN_PAST };
  }

  return null;
}

export function validateCreateBookingSlot(
  input: Pick<CreateBookingInput, "startsAtUtc">,
  allowlist: SlotDto[],
  now = new Date(),
): CreateBookingValidationError | null {
  const pastError = validateSlotNotInPast(input.startsAtUtc, now);
  if (pastError) {
    return pastError;
  }

  if (!isSlotAllowed(input.startsAtUtc, allowlist)) {
    return { code: BOOKING_MUTATION_ERROR_CODES.SLOT_UNAVAILABLE };
  }

  return null;
}

export function bookingOverlapsExisting(
  startsAtUtc: string,
  durationMinutes: number,
  bookings: { startsAtUtc: string; durationMinutes: number }[],
): boolean {
  const slotStart = Temporal.Instant.from(startsAtUtc);
  const slotEnd = slotStart.add({ minutes: durationMinutes });

  for (const booking of bookings) {
    const bookingStart = Temporal.Instant.from(booking.startsAtUtc);
    const bookingEnd = bookingStart.add({
      minutes: booking.durationMinutes,
    });

    if (
      Temporal.Instant.compare(slotStart, bookingEnd) < 0 &&
      Temporal.Instant.compare(slotEnd, bookingStart) > 0
    ) {
      return true;
    }
  }

  return false;
}
