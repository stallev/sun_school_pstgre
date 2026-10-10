import { BOOKING_STATUS, type BookingStatus } from "../types/booking-status";
import { REFUND_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { REFUND_STATUS, type RefundStatus } from "../types/refund-status";

export type RequestRefundFacts = {
  bookingStatus: BookingStatus;
  clientId: string;
  actorUserId: string;
  bookingPriceCents: number;
  amountCents: number;
  hasPendingRefund: boolean;
};

export type RequestRefundValidationError = {
  code: (typeof REFUND_MUTATION_ERROR_CODES)[keyof typeof REFUND_MUTATION_ERROR_CODES];
};

export function validateRequestRefund(
  facts: RequestRefundFacts,
): RequestRefundValidationError | null {
  if (facts.clientId !== facts.actorUserId) {
    return { code: REFUND_MUTATION_ERROR_CODES.FORBIDDEN };
  }

  if (
    facts.bookingStatus !== BOOKING_STATUS.COMPLETED &&
    facts.bookingStatus !== BOOKING_STATUS.CANCELLED
  ) {
    return { code: REFUND_MUTATION_ERROR_CODES.BOOKING_NOT_ELIGIBLE };
  }

  if (facts.amountCents > facts.bookingPriceCents) {
    return { code: REFUND_MUTATION_ERROR_CODES.AMOUNT_EXCEEDS_BOOKING };
  }

  if (facts.hasPendingRefund) {
    return { code: REFUND_MUTATION_ERROR_CODES.DUPLICATE_PENDING };
  }

  return null;
}

export type ProcessRefundFacts = {
  status: RefundStatus;
};

export type ProcessRefundValidationError = {
  code: (typeof REFUND_MUTATION_ERROR_CODES)[keyof typeof REFUND_MUTATION_ERROR_CODES];
};

export function validateProcessRefund(
  facts: ProcessRefundFacts,
): ProcessRefundValidationError | null {
  if (facts.status !== REFUND_STATUS.PENDING) {
    return { code: REFUND_MUTATION_ERROR_CODES.ALREADY_PROCESSED };
  }

  return null;
}
