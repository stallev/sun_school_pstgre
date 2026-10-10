import { REVIEW_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { BOOKING_STATUS, type BookingStatus } from "../types/booking-status";

export type PublishReviewValidationError = {
  code: (typeof REVIEW_MUTATION_ERROR_CODES)[keyof typeof REVIEW_MUTATION_ERROR_CODES];
};

export type PublishReviewFacts = {
  status: BookingStatus;
  hasReview: boolean;
};

export function validatePublishReview(
  facts: PublishReviewFacts,
): PublishReviewValidationError | null {
  if (facts.hasReview) {
    return { code: REVIEW_MUTATION_ERROR_CODES.REVIEW_ALREADY_EXISTS };
  }

  if (facts.status !== BOOKING_STATUS.COMPLETED) {
    return { code: REVIEW_MUTATION_ERROR_CODES.BOOKING_NOT_REVIEWABLE };
  }

  return null;
}
