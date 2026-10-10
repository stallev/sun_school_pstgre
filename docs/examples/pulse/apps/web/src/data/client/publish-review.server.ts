import "server-only";

import { updateTag } from "next/cache";

import {
  publishReviewInputSchema,
  REVIEW_MUTATION_ERROR_CODES,
  validatePublishReview,
  type MutationResult,
  type PublishReviewInput,
} from "@pulse/domain";
import { getPrisma, isPrismaUniqueViolation } from "@pulse/db";
import { assertCanPublishReview, PolicyError } from "@pulse/policy-server";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";


export type PublishReviewResult = MutationResult<{ reviewId: string; bookingId: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): PublishReviewResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.review.errors.unauthorized,
    };
  }

  if (error.code === "NOT_FOUND") {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.review.errors.validation,
    };
  }

  return {
    ok: false,
    code: REVIEW_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.review.errors.forbidden,
  };
}

function mapValidationError(
  code: (typeof REVIEW_MUTATION_ERROR_CODES)[keyof typeof REVIEW_MUTATION_ERROR_CODES],
  messages: Messages,
): PublishReviewResult {
  switch (code) {
    case REVIEW_MUTATION_ERROR_CODES.BOOKING_NOT_REVIEWABLE:
      return {
        ok: false,
        code,
        message: messages.review.errors.notReviewable,
      };
    case REVIEW_MUTATION_ERROR_CODES.REVIEW_ALREADY_EXISTS:
      return {
        ok: false,
        code,
        message: messages.review.errors.alreadyExists,
      };
    default:
      return {
        ok: false,
        code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.review.errors.validation,
      };
  }
}

async function runPublishReviewTransaction(
  actorUserId: string,
  input: PublishReviewInput,
  messages: Messages,
): Promise<PublishReviewResult> {
  const prisma = getPrisma();

  try {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: input.bookingId, clientId: actorUserId },
        select: {
          id: true,
          status: true,
          trainerProfileId: true,
          review: { select: { id: true } },
        },
      });

      if (!booking) {
        return {
          ok: false,
          code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
          message: messages.review.errors.validation,
        };
      }

      const validation = validatePublishReview({
        status: booking.status,
        hasReview: booking.review !== null,
      });

      if (validation) {
        return mapValidationError(validation.code, messages);
      }

      const review = await tx.review.create({
        data: {
          bookingId: input.bookingId,
          clientId: actorUserId,
          trainerProfileId: booking.trainerProfileId,
          rating: input.rating,
          body: input.body,
        },
        select: { id: true },
      });

      const aggregate = await tx.review.aggregate({
        where: {
          trainerProfileId: booking.trainerProfileId,
          isHidden: false,
        },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.trainerProfile.update({
        where: { id: booking.trainerProfileId },
        data: {
          ratingAvg: aggregate._avg.rating ?? 0,
          ratingCount: aggregate._count.rating,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "review.published",
          targetType: "review",
          targetId: review.id,
        },
      });

      return {
        ok: true,
        data: { reviewId: review.id, bookingId: input.bookingId },
      };
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return {
        ok: false,
        code: REVIEW_MUTATION_ERROR_CODES.REVIEW_ALREADY_EXISTS,
        message: messages.review.errors.alreadyExists,
      };
    }

    throw error;
  }
}

export async function publishReviewMutation(
  input: PublishReviewInput,
): Promise<PublishReviewResult> {
  const messages = await getMessages();
  const parsed = publishReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.review.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();

  try {
    await assertCanPublishReview(ctx, parsed.data.bookingId);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  if (!ctx) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.review.errors.unauthorized,
    };
  }

  return runPublishReviewTransaction(ctx.userId, parsed.data, messages);
}

async function invalidatePublishReviewCache(
  bookingId: string,
  clientUserId: string,
  trainerProfileId: string,
): Promise<void> {
  updateTag(CACHE_TAGS.bookingsClient(clientUserId));
  updateTag(CACHE_TAGS.booking(bookingId));
  updateTag(CACHE_TAGS.trainer(trainerProfileId));
}

export async function publishReviewWithCacheInvalidation(
  input: PublishReviewInput,
): Promise<PublishReviewResult> {
    const ctx = await getPolicySessionContext();
  const result = await publishReviewMutation(input);

  if (result.ok && ctx) {
    const prisma = getPrisma();
    const booking = await prisma.booking.findFirst({
      where: { id: result.data.bookingId },
      select: { trainerProfileId: true },
    });

    if (booking) {
      await invalidatePublishReviewCache(
        result.data.bookingId,
        ctx.userId,
        booking.trainerProfileId,
      );
    }
  }

  return result;
}
