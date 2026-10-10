"use server";

import {
  BOOKING_MUTATION_ERROR_CODES,
  completeBookingInputSchema,
  type CompleteBookingInput,
  type MutationResult,
} from "@pulse/domain";

import { completeBookingWithCacheInvalidation } from "@/data/trainer/complete-booking.server";
import { getMessages } from "@/lib/messages/server";


function mapCompleteError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.booking.errors.unauthorized;
    case BOOKING_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.booking.errors.forbidden;
    case BOOKING_MUTATION_ERROR_CODES.BOOKING_STATE_CONFLICT:
      return messages.booking.errors.stateConflict;
    case BOOKING_MUTATION_ERROR_CODES.BOOKING_TERMINAL:
    case BOOKING_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION:
      return messages.booking.errors.terminal;
    default:
      return messages.trainer.clients.errors.generic;
  }
}

export async function completeBookingAction(
  input: CompleteBookingInput,
): Promise<MutationResult<{ id: string; status: string }>> {
  const messages = await getMessages();

  const parsed = completeBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.booking.errors.validation,
    };
  }

  const result = await completeBookingWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapCompleteError(result.code, messages) };
  }

  return result;
}
