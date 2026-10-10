"use server";

import { redirect } from "next/navigation";

import {
  TRAINER_MUTATION_ERROR_CODES,
  updateTrainerProfileSchema,
  type MutationResult,
  type UpdateTrainerProfileInput,
} from "@pulse/domain";

import { updateTrainerProfile } from "@/data/trainer/update-trainer-profile.server";
import { getMessages } from "@/lib/messages/server";


export type UpdateTrainerProfileState = MutationResult<{ profileId: string }> | null;

function mapUpdateError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case TRAINER_MUTATION_ERROR_CODES.VALIDATION:
      return messages.trainer.editProfile.errors.validation;
    case TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.trainer.editProfile.errors.unauthorized;
    case TRAINER_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.trainer.editProfile.errors.forbidden;
    default:
      return messages.trainer.editProfile.errors.generic;
  }
}

export async function updateTrainerProfileAction(
  input: UpdateTrainerProfileInput,
): Promise<UpdateTrainerProfileState> {
  const messages = await getMessages();
  const parsed = updateTrainerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.editProfile.errors.validation,
    };
  }

  const result = await updateTrainerProfile(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapUpdateError(result.code, messages) };
  }

  redirect("/trainer/profile?saved=1");
}
