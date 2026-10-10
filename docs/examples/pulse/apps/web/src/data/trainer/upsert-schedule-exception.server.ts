import "server-only";

import { updateTag } from "next/cache";

import {
  scheduleExceptionInputSchema,
  SCHEDULE_MUTATION_ERROR_CODES,
  type MutationResult,
  type ScheduleExceptionInput,
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

export type UpsertScheduleExceptionResult = MutationResult<{
  profileId: string;
  exceptionId: string;
}>;

function mapPolicyError(error: PolicyError, messages: Messages): UpsertScheduleExceptionResult {
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

export async function upsertScheduleExceptionMutation(
  input: ScheduleExceptionInput,
): Promise<UpsertScheduleExceptionResult> {
  const messages = await getMessages();
  const parsed = scheduleExceptionInputSchema.safeParse(input);
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

  const exceptionDate = new Date(`${parsed.data.exceptionDate}T00:00:00.000Z`);
  const prisma = getPrisma();

  const row = await prisma.trainerScheduleException.upsert({
    where: {
      trainerProfileId_exceptionDate: {
        trainerProfileId: ownership.profileId,
        exceptionDate,
      },
    },
    create: {
      trainerProfileId: ownership.profileId,
      exceptionDate,
      isBlocked: parsed.data.isBlocked,
      reason: parsed.data.reason ?? null,
    },
    update: {
      isBlocked: parsed.data.isBlocked,
      reason: parsed.data.reason ?? null,
    },
    select: { id: true },
  });

  return {
    ok: true,
    data: { profileId: ownership.profileId, exceptionId: row.id },
  };
}

export async function upsertScheduleExceptionWithCacheInvalidation(
  input: ScheduleExceptionInput,
): Promise<UpsertScheduleExceptionResult> {
    const result = await upsertScheduleExceptionMutation(input);

  if (result.ok) {
    updateTag(CACHE_TAGS.trainer(result.data.profileId));
    updateTag(CACHE_TAGS.trainerSchedule(result.data.profileId));
  }

  return result;
}
