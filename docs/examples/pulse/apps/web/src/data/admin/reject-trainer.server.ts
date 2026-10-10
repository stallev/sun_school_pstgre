import "server-only";

import { updateTag } from "next/cache";

import {
  rejectTrainerInputSchema,
  TRAINER_MUTATION_ERROR_CODES,
  TRAINER_STATUS,
  validateRejectTrainer,
  type MutationResult,
  type RejectTrainerInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanApproveTrainer, PolicyError } from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type RejectTrainerResult = MutationResult<{ trainerProfileId: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): RejectTrainerResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  return {
    ok: false,
    code: TRAINER_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.admin.errors.forbidden,
  };
}

async function runRejectTrainerTransaction(
  actorUserId: string,
  input: RejectTrainerInput,
  messages: Messages,
): Promise<RejectTrainerResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const profile = await tx.trainerProfile.findFirst({
      where: { id: input.trainerProfileId },
      select: { status: true },
    });

    if (!profile) {
      return {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.admin.errors.notFound,
      };
    }

    const validation = validateRejectTrainer({ status: profile.status });
    if (validation) {
      return {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.moderation.alreadyProcessed,
      };
    }

    const updated = await tx.trainerProfile.updateMany({
      where: {
        id: input.trainerProfileId,
        status: TRAINER_STATUS.PENDING,
      },
      data: {
        status: TRAINER_STATUS.REJECTED,
        reviewedAt: new Date(),
        reviewedById: actorUserId,
        rejectionReason: input.rejectionReason,
      },
    });

    if (updated.count === 0) {
      return {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.moderation.alreadyProcessed,
      };
    }

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "trainer.rejected",
        targetType: "trainer_profile",
        targetId: input.trainerProfileId,
      },
    });

    return { ok: true, data: { trainerProfileId: input.trainerProfileId } };
  });
}

export async function rejectTrainerMutation(
  input: RejectTrainerInput,
): Promise<RejectTrainerResult> {
  const messages = await getMessages();
  const parsed = rejectTrainerInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.moderation.rejectionReasonRequired,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  try {
    assertCanApproveTrainer(ctx);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  return runRejectTrainerTransaction(ctx.userId, parsed.data, messages);
}

export async function rejectTrainerWithCacheInvalidation(
  input: RejectTrainerInput,
): Promise<RejectTrainerResult> {
    const result = await rejectTrainerMutation(input);

  if (result.ok) {
    updateTag(CACHE_TAGS.trainer(result.data.trainerProfileId));
  }

  return result;
}
