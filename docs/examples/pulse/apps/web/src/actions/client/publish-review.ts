"use server";

import { redirect } from "next/navigation";

import {
  publishReviewInputSchema,
  REVIEW_MUTATION_ERROR_CODES,
  type MutationResult,
} from "@pulse/domain";

import { publishReviewWithCacheInvalidation } from "@/data/client/publish-review.server";
import { getMessages } from "@/lib/messages/server";


export async function submitReviewAction(
  _prev: MutationResult<{ reviewId: string; bookingId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ reviewId: string; bookingId: string }>> {
  const messages = await getMessages();

  const parsed = publishReviewInputSchema.safeParse({
    bookingId: String(formData.get("bookingId") ?? "").trim(),
    rating: String(formData.get("rating") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.review.errors.validation,
    };
  }

  const result = await publishReviewWithCacheInvalidation(parsed.data);

  if (!result.ok) {
    if (result.code === REVIEW_MUTATION_ERROR_CODES.REVIEW_ALREADY_EXISTS) {
      redirect(`/client/bookings/${parsed.data.bookingId}`);
    }

    return result;
  }

  redirect(`/client/bookings/${result.data.bookingId}?reviewed=1`);
}
