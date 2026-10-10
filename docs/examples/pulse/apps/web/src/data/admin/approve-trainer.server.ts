import "server-only";

import { updateTag } from "next/cache";

import {
  approveTrainerInputSchema,
  TRAINER_MUTATION_ERROR_CODES,
  TRAINER_STATUS,
  validateApproveTrainer,
  type ApproveTrainerInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanApproveTrainer, PolicyError } from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type ApproveTrainerResult = MutationResult<{ trainerProfileId: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): ApproveTrainerResult {
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

function mapValidationError(
  code: (typeof TRAINER_MUTATION_ERROR_CODES)[keyof typeof TRAINER_MUTATION_ERROR_CODES],
  messages: Messages,
): ApproveTrainerResult {
  switch (code) {
    case TRAINER_MUTATION_ERROR_CODES.APPLICATION_INCOMPLETE:
      return {
        ok: false,
        code,
        message: messages.admin.moderation.incomplete,
      };
    case TRAINER_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION:
    case TRAINER_MUTATION_ERROR_CODES.ALREADY_PROCESSED:
      return {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.moderation.alreadyProcessed,
      };
    default:
      return {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.admin.errors.validation,
      };
  }
}

async function runApproveTrainerTransaction(
  actorUserId: string,
  trainerProfileId: string,
  messages: Messages,
): Promise<ApproveTrainerResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const profile = await tx.trainerProfile.findFirst({
      where: { id: trainerProfileId },
      select: {
        status: true,
        certificates: {
          select: { fileAsset: { select: { uploadStatus: true } } },
        },
        verificationDocuments: {
          select: { fileAsset: { select: { uploadStatus: true } } },
        },
      },
    });

    if (!profile) {
      return {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.admin.errors.notFound,
      };
    }

    const validation = validateApproveTrainer({
      status: profile.status,
      certificates: profile.certificates.map((certificate) => ({
        uploadStatus: certificate.fileAsset?.uploadStatus ?? "failed",
      })),
      verificationDocuments: profile.verificationDocuments.map((document) => ({
        uploadStatus: document.fileAsset?.uploadStatus ?? "failed",
      })),
    });

    if (validation) {
      return mapValidationError(validation.code, messages);
    }

    const updated = await tx.trainerProfile.updateMany({
      where: {
        id: trainerProfileId,
        status: TRAINER_STATUS.PENDING,
      },
      data: {
        status: TRAINER_STATUS.APPROVED,
        reviewedAt: new Date(),
        reviewedById: actorUserId,
        rejectionReason: null,
      },
    });

    if (updated.count === 0) {
      return mapValidationError(TRAINER_MUTATION_ERROR_CODES.ALREADY_PROCESSED, messages);
    }

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "trainer.approved",
        targetType: "trainer_profile",
        targetId: trainerProfileId,
      },
    });

    return { ok: true, data: { trainerProfileId } };
  });
}

export async function approveTrainerMutation(
  input: ApproveTrainerInput,
): Promise<ApproveTrainerResult> {
  const messages = await getMessages();
  const parsed = approveTrainerInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
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

  return runApproveTrainerTransaction(ctx.userId, parsed.data.trainerProfileId, messages);
}

export async function approveTrainerWithCacheInvalidation(
  input: ApproveTrainerInput,
): Promise<ApproveTrainerResult> {
    const result = await approveTrainerMutation(input);

  if (result.ok) {
    updateTag(CACHE_TAGS.trainersCatalog);
    updateTag(CACHE_TAGS.trainer(result.data.trainerProfileId));
  }

  return result;
}
