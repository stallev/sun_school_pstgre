import { BOOKING_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { BOOKING_STATUS, type BookingStatus } from "../types/booking-status";

export const CLIENT_CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CancelBookingValidationError = {
  code: (typeof BOOKING_MUTATION_ERROR_CODES)[keyof typeof BOOKING_MUTATION_ERROR_CODES];
};

export type ClientCancelBookingFacts = {
  status: BookingStatus;
  startsAtUtc: string;
};

const CLIENT_CANCELLABLE_STATUSES = new Set<BookingStatus>([
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED,
]);

export function isClientCancellationWindowOpen(
  startsAtUtc: string,
  now: Date = new Date(),
): boolean {
  const startsAt = new Date(startsAtUtc).getTime();
  if (Number.isNaN(startsAt)) {
    return false;
  }

  return now.getTime() < startsAt - CLIENT_CANCELLATION_WINDOW_MS;
}

export function validateClientCancelBooking(
  facts: ClientCancelBookingFacts,
  now: Date = new Date(),
): CancelBookingValidationError | null {
  if (facts.status === BOOKING_STATUS.CANCELLED) {
    return { code: BOOKING_MUTATION_ERROR_CODES.BOOKING_TERMINAL };
  }

  if (facts.status === BOOKING_STATUS.COMPLETED) {
    return { code: BOOKING_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION };
  }

  if (!CLIENT_CANCELLABLE_STATUSES.has(facts.status)) {
    return { code: BOOKING_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION };
  }

  if (!isClientCancellationWindowOpen(facts.startsAtUtc, now)) {
    return { code: BOOKING_MUTATION_ERROR_CODES.CANCELLATION_WINDOW_CLOSED };
  }

  return null;
}

export function canClientCancelBooking(
  facts: ClientCancelBookingFacts,
  now: Date = new Date(),
): boolean {
  return validateClientCancelBooking(facts, now) === null;
}
