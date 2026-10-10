import "server-only";

import { updateTag } from "next/cache";

import {
  deleteReviewInputSchema,
  hideReviewInputSchema,
  REVIEW_MUTATION_ERROR_CODES,
  validateDeleteReview,
  validateHideReview,
  type DeleteReviewInput,
  type HideReviewInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma, type Prisma } from "@pulse/db";
import { assertCanModerateReview, PolicyError } from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

type ReviewModerationResult = MutationResult<{ reviewId: string; trainerProfileId: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): ReviewModerationResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  return {
    ok: false,
    code: REVIEW_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.admin.errors.forbidden,
  };
}

async function recalcTrainerRating(
  tx: Prisma.TransactionClient,
  trainerProfileId: string,
): Promise<void> {
  const aggregate = await tx.review.aggregate({
    where: { trainerProfileId, isHidden: false },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await tx.trainerProfile.update({
    where: { id: trainerProfileId },
    data: {
      ratingAvg: aggregate._avg.rating ?? 0,
      ratingCount: aggregate._count.rating,
    },
  });
}

async function runHideReviewTransaction(
  actorUserId: string,
  reviewId: string,
  messages: Messages,
): Promise<ReviewModerationResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findFirst({
      where: { id: reviewId },
      select: { id: true, isHidden: true, trainerProfileId: true },
    });

    if (!review) {
      return {
        ok: false,
        code: REVIEW_MUTATION_ERROR_CODES.NOT_FOUND,
        message: messages.admin.errors.notFound,
      };
    }

    const validation = validateHideReview({ isHidden: review.isHidden });
    if (validation) {
      return {
        ok: false,
        code: REVIEW_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.reviews.alreadyProcessed,
      };
    }

    await tx.review.update({
      where: { id: reviewId },
      data: {
        isHidden: true,
        hiddenAt: new Date(),
        hiddenById: actorUserId,
      },
    });

    await recalcTrainerRating(tx, review.trainerProfileId);

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "review.hidden",
        targetType: "review",
        targetId: reviewId,
      },
    });

    return {
      ok: true,
      data: { reviewId, trainerProfileId: review.trainerProfileId },
    };
  });
}

async function runDeleteReviewTransaction(
  actorUserId: string,
  reviewId: string,
  messages: Messages,
): Promise<ReviewModerationResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findFirst({
      where: { id: reviewId },
      select: { id: true, trainerProfileId: true },
    });

    const validation = validateDeleteReview({ exists: review !== null });
    if (validation) {
      return {
        ok: false,
        code: REVIEW_MUTATION_ERROR_CODES.NOT_FOUND,
        message: messages.admin.errors.notFound,
      };
    }

    if (!review) {
      return {
        ok: false,
        code: REVIEW_MUTATION_ERROR_CODES.NOT_FOUND,
        message: messages.admin.errors.notFound,
      };
    }

    await tx.review.delete({ where: { id: reviewId } });
    await recalcTrainerRating(tx, review.trainerProfileId);

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "review.deleted",
        targetType: "review",
        targetId: reviewId,
      },
    });

    return {
      ok: true,
      data: { reviewId, trainerProfileId: review.trainerProfileId },
    };
  });
}

export async function hideReviewMutation(
  input: HideReviewInput,
): Promise<ReviewModerationResult> {
  const messages = await getMessages();
  const parsed = hideReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  try {
    assertCanModerateReview(ctx);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  return runHideReviewTransaction(ctx.userId, parsed.data.reviewId, messages);
}

export async function deleteReviewMutation(
  input: DeleteReviewInput,
): Promise<ReviewModerationResult> {
  const messages = await getMessages();
  const parsed = deleteReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: REVIEW_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  try {
    assertCanModerateReview(ctx);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  return runDeleteReviewTransaction(ctx.userId, parsed.data.reviewId, messages);
}

async function invalidateReviewModerationCache(
  trainerProfileId: string,
): Promise<void> {
  updateTag(CACHE_TAGS.trainer(trainerProfileId));
}

export async function hideReviewWithCacheInvalidation(
  input: HideReviewInput,
): Promise<ReviewModerationResult> {
  const result = await hideReviewMutation(input);

  if (result.ok) {
    await invalidateReviewModerationCache(result.data.trainerProfileId);
  }

  return result;
}

export async function deleteReviewWithCacheInvalidation(
  input: DeleteReviewInput,
): Promise<ReviewModerationResult> {
    const result = await deleteReviewMutation(input);

  if (result.ok) {
    await invalidateReviewModerationCache(result.data.trainerProfileId);
  }

  return result;
}
