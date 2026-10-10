import "server-only";

import { updateTag } from "next/cache";

import {
  deleteScheduleExceptionInputSchema,
  SCHEDULE_MUTATION_ERROR_CODES,
  type DeleteScheduleExceptionInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanMutateSchedule,
  PolicyError,
} from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

import { getTrainerProfileOwnershipFacts } from "./get-trainer-schedule-for-edit.server";

export type DeleteScheduleExceptionResult = MutationResult<{ profileId: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): DeleteScheduleExceptionResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.trainer.schedule.errors.unauthorized,
    };
  }

  return {
    ok: false,
    code: SCHEDULE_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.trainer.schedule.errors.forbidden,
  };
}

export async function deleteScheduleExceptionMutation(
  input: DeleteScheduleExceptionInput,
): Promise<DeleteScheduleExceptionResult> {
  const messages = await getMessages();
  const parsed = deleteScheduleExceptionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.schedule.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  const ownership = ctx ? await getTrainerProfileOwnershipFacts(ctx.userId) : null;

  if (!ctx || !ownership) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.trainer.schedule.errors.unauthorized,
    };
  }

  try {
    assertCanMutateSchedule(ctx, { ownerUserId: ownership.ownerUserId });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  const prisma = getPrisma();
  const deleted = await prisma.trainerScheduleException.deleteMany({
    where: {
      id: parsed.data.exceptionId,
      trainerProfileId: ownership.profileId,
    },
  });

  if (deleted.count === 0) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.NOT_FOUND,
      message: messages.trainer.schedule.errors.notFound,
    };
  }

  return { ok: true, data: { profileId: ownership.profileId } };
}

export async function deleteScheduleExceptionWithCacheInvalidation(
  input: DeleteScheduleExceptionInput,
): Promise<DeleteScheduleExceptionResult> {
    const result = await deleteScheduleExceptionMutation(input);

  if (result.ok) {
    updateTag(CACHE_TAGS.trainer(result.data.profileId));
    updateTag(CACHE_TAGS.trainerSchedule(result.data.profileId));
  }

  return result;
}
