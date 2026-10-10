"use server";

import {
  SCHEDULE_MUTATION_ERROR_CODES,
  saveWeeklyScheduleInputSchema,
  type MutationResult,
  type SaveWeeklyScheduleInput,
} from "@pulse/domain";

import { upsertWeeklyScheduleWithCacheInvalidation } from "@/data/trainer/upsert-weekly-schedule.server";
import { getMessages } from "@/lib/messages/server";


function mapScheduleError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case SCHEDULE_MUTATION_ERROR_CODES.INVALID_INTERVAL:
      return messages.trainer.schedule.errors.invalidInterval;
    case SCHEDULE_MUTATION_ERROR_CODES.INTERVAL_OVERLAP:
      return messages.trainer.schedule.errors.intervalOverlap;
    case SCHEDULE_MUTATION_ERROR_CODES.INVALID_TIMEZONE:
      return messages.trainer.schedule.errors.invalidTimezone;
    case SCHEDULE_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.trainer.schedule.errors.unauthorized;
    case SCHEDULE_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.trainer.schedule.errors.forbidden;
    case SCHEDULE_MUTATION_ERROR_CODES.VALIDATION:
      return messages.trainer.schedule.errors.validation;
    default:
      return messages.trainer.schedule.errors.generic;
  }
}

export async function saveWeeklyScheduleAction(
  input: SaveWeeklyScheduleInput,
): Promise<MutationResult<{ profileId: string }>> {
  const messages = await getMessages();

  const parsed = saveWeeklyScheduleInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.schedule.errors.validation,
    };
  }

  const result = await upsertWeeklyScheduleWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapScheduleError(result.code, messages) };
  }

  return result;
}
