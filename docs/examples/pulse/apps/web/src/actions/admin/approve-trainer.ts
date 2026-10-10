"use server";

import {
  approveTrainerInputSchema,
  TRAINER_MUTATION_ERROR_CODES,
  type ApproveTrainerInput,
  type MutationResult,
} from "@pulse/domain";

import { approveTrainerWithCacheInvalidation } from "@/data/admin/approve-trainer.server";
import { getMessages } from "@/lib/messages/server";


function mapApproveError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.admin.errors.unauthorized;
    case TRAINER_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.admin.errors.forbidden;
    case TRAINER_MUTATION_ERROR_CODES.APPLICATION_INCOMPLETE:
      return messages.admin.moderation.incomplete;
    case TRAINER_MUTATION_ERROR_CODES.ALREADY_PROCESSED:
      return messages.admin.moderation.alreadyProcessed;
    default:
      return messages.admin.errors.generic;
  }
}

export async function approveTrainerAction(
  input: ApproveTrainerInput,
): Promise<MutationResult<{ trainerProfileId: string }>> {
  const messages = await getMessages();

  const parsed = approveTrainerInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const result = await approveTrainerWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapApproveError(result.code, messages) };
  }

  return result;
}
