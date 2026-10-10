import { BOOKING_STATUS, type BookingStatus } from "../types/booking-status";
import { COMPLAINT_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { COMPLAINT_STATUS, type ComplaintStatus } from "../types/complaint-status";

export type FileComplaintFacts = {
  bookingStatus: BookingStatus;
  clientId: string;
  actorUserId: string;
  hasOpenComplaint: boolean;
};

export type FileComplaintValidationError = {
  code: (typeof COMPLAINT_MUTATION_ERROR_CODES)[keyof typeof COMPLAINT_MUTATION_ERROR_CODES];
};

export function validateFileComplaint(
  facts: FileComplaintFacts,
): FileComplaintValidationError | null {
  if (facts.clientId !== facts.actorUserId) {
    return { code: COMPLAINT_MUTATION_ERROR_CODES.FORBIDDEN };
  }

  if (
    facts.bookingStatus !== BOOKING_STATUS.COMPLETED &&
    facts.bookingStatus !== BOOKING_STATUS.CANCELLED &&
    facts.bookingStatus !== BOOKING_STATUS.CONFIRMED
  ) {
    return { code: COMPLAINT_MUTATION_ERROR_CODES.BOOKING_NOT_ELIGIBLE };
  }

  if (facts.hasOpenComplaint) {
    return { code: COMPLAINT_MUTATION_ERROR_CODES.DUPLICATE_OPEN };
  }

  return null;
}

export type StartComplaintReviewFacts = {
  status: ComplaintStatus;
};

export function validateStartComplaintReview(
  facts: StartComplaintReviewFacts,
): FileComplaintValidationError | null {
  if (facts.status !== COMPLAINT_STATUS.OPEN) {
    return { code: COMPLAINT_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION };
  }

  return null;
}
