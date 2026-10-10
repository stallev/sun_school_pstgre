import { BOOKING_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { BOOKING_STATUS, type BookingStatus } from "../types/booking-status";

export type CompleteBookingValidationError = {
  code: (typeof BOOKING_MUTATION_ERROR_CODES)[keyof typeof BOOKING_MUTATION_ERROR_CODES];
};

export type CompleteBookingFacts = {
  status: BookingStatus;
};

export function validateCompleteBooking(
  facts: CompleteBookingFacts,
): CompleteBookingValidationError | null {
  if (facts.status === BOOKING_STATUS.COMPLETED) {
    return { code: BOOKING_MUTATION_ERROR_CODES.BOOKING_TERMINAL };
  }

  if (facts.status === BOOKING_STATUS.CANCELLED) {
    return { code: BOOKING_MUTATION_ERROR_CODES.BOOKING_TERMINAL };
  }

  if (facts.status !== BOOKING_STATUS.CONFIRMED) {
    return { code: BOOKING_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION };
  }

  return null;
}

export function canCompleteBooking(facts: CompleteBookingFacts): boolean {
  return validateCompleteBooking(facts) === null;
}
