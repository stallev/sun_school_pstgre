import "server-only";

import { updateTag } from "next/cache";

import {
  saveWeeklyScheduleInputSchema,
  SCHEDULE_MUTATION_ERROR_CODES,
  validateTrainerTimezone,
  validateWeeklyIntervals,
  type MutationResult,
  type SaveWeeklyScheduleInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanMutateSchedule,
  PolicyError,
} from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { localTimeToPrismaTime } from "@/lib/trainer/schedule-time";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

import { getTrainerProfileOwnershipFacts } from "./get-trainer-schedule-for-edit.server";

export type SaveWeeklyScheduleResult = MutationResult<{ profileId: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): SaveWeeklyScheduleResult {
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

function mapValidationError(
  code: (typeof SCHEDULE_MUTATION_ERROR_CODES)[keyof typeof SCHEDULE_MUTATION_ERROR_CODES],
  messages: Messages,
): SaveWeeklyScheduleResult {
  switch (code) {
    case SCHEDULE_MUTATION_ERROR_CODES.INVALID_INTERVAL:
      return {
        ok: false,
        code,
        message: messages.trainer.schedule.errors.invalidInterval,
      };
    case SCHEDULE_MUTATION_ERROR_CODES.INTERVAL_OVERLAP:
      return {
        ok: false,
        code,
        message: messages.trainer.schedule.errors.intervalOverlap,
      };
    case SCHEDULE_MUTATION_ERROR_CODES.INVALID_TIMEZONE:
      return {
        ok: false,
        code,
        message: messages.trainer.schedule.errors.invalidTimezone,
      };
    default:
      return {
        ok: false,
        code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.trainer.schedule.errors.validation,
      };
  }
}

export async function upsertWeeklyScheduleMutation(
  input: SaveWeeklyScheduleInput,
): Promise<SaveWeeklyScheduleResult> {
  const messages = await getMessages();
  const parsed = saveWeeklyScheduleInputSchema.safeParse(input);
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
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: ownership.profileId },
    select: { timezone: true },
  });

  if (!profile) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.schedule.errors.validation,
    };
  }

  const timezoneValidation = validateTrainerTimezone(profile.timezone);
  if (timezoneValidation) {
    return mapValidationError(SCHEDULE_MUTATION_ERROR_CODES.INVALID_TIMEZONE, messages);
  }

  const intervalValidation = validateWeeklyIntervals(parsed.data.intervals);
  if (intervalValidation) {
    return mapValidationError(intervalValidation.code, messages);
  }

  await prisma.$transaction(async (tx) => {
    await tx.trainerWeeklyInterval.deleteMany({
      where: { trainerProfileId: ownership.profileId },
    });

    if (parsed.data.intervals.length > 0) {
      await tx.trainerWeeklyInterval.createMany({
        data: parsed.data.intervals.map((interval) => ({
          trainerProfileId: ownership.profileId,
          dayOfWeek: interval.dayOfWeek,
          startTime: localTimeToPrismaTime(interval.startTime),
          endTime: localTimeToPrismaTime(interval.endTime),
        })),
      });
    }
  });

  return { ok: true, data: { profileId: ownership.profileId } };
}

export async function upsertWeeklyScheduleWithCacheInvalidation(
  input: SaveWeeklyScheduleInput,
): Promise<SaveWeeklyScheduleResult> {
    const result = await upsertWeeklyScheduleMutation(input);

  if (result.ok) {
    updateTag(CACHE_TAGS.trainer(result.data.profileId));
    updateTag(CACHE_TAGS.trainerSchedule(result.data.profileId));
  }

  return result;
}
