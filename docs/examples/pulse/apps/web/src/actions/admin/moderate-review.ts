"use server";

import {
  deleteReviewInputSchema,
  hideReviewInputSchema,
  REVIEW_MUTATION_ERROR_CODES,
  type DeleteReviewInput,
  type HideReviewInput,
  type MutationResult,
} from "@pulse/domain";

import {
  deleteReviewWithCacheInvalidation,
  hideReviewWithCacheInvalidation,
} from "@/data/admin/moderate-review.server";
import { getMessages } from "@/lib/messages/server";


function mapReviewError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case REVIEW_MUTATION_ERROR_CODES.ALREADY_PROCESSED:
      return messages.admin.reviews.alreadyProcessed;
    case REVIEW_MUTATION_ERROR_CODES.NOT_FOUND:
      return messages.admin.errors.notFound;
    default:
      return messages.admin.errors.generic;
  }
}

export async function hideReviewAction(
  input: HideReviewInput,
): Promise<MutationResult<{ reviewId: string; trainerProfileId: string }>> {
  const messages = await getMessages();

  const parsed = hideReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const result = await hideReviewWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapReviewError(result.code, messages) };
  }

  return result;
}

export async function deleteReviewAction(
  input: DeleteReviewInput,
): Promise<MutationResult<{ reviewId: string; trainerProfileId: string }>> {
  const messages = await getMessages();

  const parsed = deleteReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const result = await deleteReviewWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapReviewError(result.code, messages) };
  }

  return result;
}
