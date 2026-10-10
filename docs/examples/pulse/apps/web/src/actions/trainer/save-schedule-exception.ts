"use server";

import {
  SCHEDULE_MUTATION_ERROR_CODES,
  scheduleExceptionInputSchema,
  type MutationResult,
  type ScheduleExceptionInput,
} from "@pulse/domain";

import { upsertScheduleExceptionWithCacheInvalidation } from "@/data/trainer/upsert-schedule-exception.server";
import { getMessages } from "@/lib/messages/server";


export async function saveScheduleExceptionAction(
  input: ScheduleExceptionInput,
): Promise<MutationResult<{ profileId: string; exceptionId: string }>> {
  const messages = await getMessages();

  const parsed = scheduleExceptionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.schedule.errors.validation,
    };
  }

  const result = await upsertScheduleExceptionWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message: messages.trainer.schedule.errors.generic,
    };
  }

  return result;
}
