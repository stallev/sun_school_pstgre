"use server";

import {
  TRAINER_SERVICE_MUTATION_ERROR_CODES,
  type MutationResult,
} from "@pulse/domain";

import { deleteTrainerService } from "@/data/trainer/trainer-service-mutations.server";
import { getMessages } from "@/lib/messages/server";


function mapDeleteError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case TRAINER_SERVICE_MUTATION_ERROR_CODES.SERVICE_HAS_BOOKINGS:
      return messages.trainer.services.deleteHasBookings;
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

export async function deleteTrainerServiceAction(
  serviceId: string,
): Promise<MutationResult<Record<string, never>>> {
  const messages = await getMessages();
  const result = await deleteTrainerService(serviceId);
  if (!result.ok) {
    return { ...result, message: mapDeleteError(result.code, messages) };
  }

  return result;
}
