import "server-only";

import {
  BOOKING_STATUS,
  upsertTrainerClientNoteInputSchema,
  SCHEDULE_MUTATION_ERROR_CODES,
  type MutationResult,
  type UpsertTrainerClientNoteInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanUpsertTrainerClientNote,
  PolicyError,
} from "@pulse/policy-server";

import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

import { getTrainerProfileOwnershipFacts } from "./get-trainer-schedule-for-edit.server";

export type UpsertTrainerClientNoteResult = MutationResult<{ clientId: string }>;

async function trainerHasClientRelationship(
  trainerProfileId: string,
  clientId: string,
): Promise<boolean> {
  const booking = await getPrisma().booking.findFirst({
    where: {
      trainerProfileId,
      clientId,
      status: { not: BOOKING_STATUS.CANCELLED },
    },
    select: { id: true },
  });

  return Boolean(booking);
}

function mapPolicyError(error: PolicyError, messages: Messages): UpsertTrainerClientNoteResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.trainer.clients.errors.unauthorized,
    };
  }

  return {
    ok: false,
    code: SCHEDULE_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.trainer.clients.errors.forbidden,
  };
}

export async function upsertTrainerClientNoteMutation(
  input: UpsertTrainerClientNoteInput,
): Promise<UpsertTrainerClientNoteResult> {
  const messages = await getMessages();
  const parsed = upsertTrainerClientNoteInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.clients.errors.generic,
    };
  }

  const ctx = await getPolicySessionContext();
  const ownership = ctx ? await getTrainerProfileOwnershipFacts(ctx.userId) : null;

  if (!ctx || !ownership) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.trainer.clients.errors.unauthorized,
    };
  }

  try {
    assertCanUpsertTrainerClientNote(ctx, {
      trainerOwnerUserId: ownership.ownerUserId,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  const hasRelationship = await trainerHasClientRelationship(
    ownership.profileId,
    parsed.data.clientId,
  );
  if (!hasRelationship) {
    return {
      ok: false,
      code: SCHEDULE_MUTATION_ERROR_CODES.FORBIDDEN,
      message: messages.trainer.clients.errors.forbidden,
    };
  }

  await getPrisma().trainerClientNote.upsert({
    where: {
      trainerProfileId_clientId: {
        trainerProfileId: ownership.profileId,
        clientId: parsed.data.clientId,
      },
    },
    create: {
      trainerProfileId: ownership.profileId,
      clientId: parsed.data.clientId,
      notes: parsed.data.notes,
    },
    update: {
      notes: parsed.data.notes,
    },
  });

  return { ok: true, data: { clientId: parsed.data.clientId } };
}
