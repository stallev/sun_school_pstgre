import { REVIEW_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";

export type HideReviewFacts = {
  isHidden: boolean;
};

export type HideReviewValidationError = {
  code: (typeof REVIEW_MUTATION_ERROR_CODES)[keyof typeof REVIEW_MUTATION_ERROR_CODES];
};

export function validateHideReview(
  facts: HideReviewFacts,
): HideReviewValidationError | null {
  if (facts.isHidden) {
    return { code: REVIEW_MUTATION_ERROR_CODES.ALREADY_PROCESSED };
  }

  return null;
}

export type DeleteReviewFacts = {
  exists: boolean;
};

export function validateDeleteReview(
  facts: DeleteReviewFacts,
): HideReviewValidationError | null {
  if (!facts.exists) {
    return { code: REVIEW_MUTATION_ERROR_CODES.NOT_FOUND };
  }

  return null;
}
