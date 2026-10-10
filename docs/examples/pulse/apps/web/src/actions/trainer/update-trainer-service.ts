"use server";

import {
  TRAINER_SERVICE_MUTATION_ERROR_CODES,
  updateTrainerServiceSchema,
  type MutationResult,
  type UpdateTrainerServiceInput,
} from "@pulse/domain";

import { updateTrainerService } from "@/data/trainer/trainer-service-mutations.server";
import { getMessages } from "@/lib/messages/server";


function mapServiceError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case TRAINER_SERVICE_MUTATION_ERROR_CODES.VALIDATION:
      return messages.trainer.services.errors.validation;
    case TRAINER_SERVICE_MUTATION_ERROR_CODES.NOT_FOUND:
      return messages.trainer.services.errors.notFound;
    case TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.trainer.services.errors.unauthorized;
    case TRAINER_SERVICE_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.trainer.services.errors.forbidden;
    default:
      return messages.trainer.services.errors.generic;
  }
}

export async function updateTrainerServiceAction(
  input: UpdateTrainerServiceInput,
): Promise<MutationResult<{ serviceId: string }>> {
  const messages = await getMessages();

  const parsed = updateTrainerServiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_SERVICE_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.services.errors.validation,
    };
  }

  const result = await updateTrainerService(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapServiceError(result.code, messages) };
  }

  return result;
}
