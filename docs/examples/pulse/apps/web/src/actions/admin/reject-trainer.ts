"use server";

import {
  rejectTrainerInputSchema,
  TRAINER_MUTATION_ERROR_CODES,
  type MutationResult,
  type RejectTrainerInput,
} from "@pulse/domain";

import { rejectTrainerWithCacheInvalidation } from "@/data/admin/reject-trainer.server";
import { getMessages } from "@/lib/messages/server";


function mapRejectError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.admin.errors.unauthorized;
    case TRAINER_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.admin.errors.forbidden;
    case TRAINER_MUTATION_ERROR_CODES.ALREADY_PROCESSED:
      return messages.admin.moderation.alreadyProcessed;
    case TRAINER_MUTATION_ERROR_CODES.VALIDATION:
      return messages.admin.moderation.rejectionReasonRequired;
    default:
      return messages.admin.errors.generic;
  }
}

export async function rejectTrainerAction(
  input: RejectTrainerInput,
): Promise<MutationResult<{ trainerProfileId: string }>> {
  const messages = await getMessages();

  const parsed = rejectTrainerInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.moderation.rejectionReasonRequired,
    };
  }

  const result = await rejectTrainerWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapRejectError(result.code, messages) };
  }

  return result;
}
