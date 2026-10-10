"use server";

import {
  deleteScheduleExceptionInputSchema,
  SCHEDULE_MUTATION_ERROR_CODES,
  type DeleteScheduleExceptionInput,
  type MutationResult,
} from "@pulse/domain";

import { deleteScheduleExceptionWithCacheInvalidation } from "@/data/trainer/delete-schedule-exception.server";
import { getMessages } from "@/lib/messages/server";


export async function deleteScheduleExceptionAction(
  input: DeleteScheduleExceptionInput,
): Promise<MutationResult<{ profileId: string }>> {
  const messages = await getMessages();

  const parsed = deleteScheduleExceptionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.schedule.errors.validation,
    };
  }

  const result = await deleteScheduleExceptionWithCacheInvalidation(parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message:
        result.code === SCHEDULE_MUTATION_ERROR_CODES.NOT_FOUND
          ? messages.trainer.schedule.errors.notFound
          : messages.trainer.schedule.errors.generic,
    };
  }

  return result;
}
