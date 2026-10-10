"use server";

import {
  saveOnboardingStep1Schema,
  TRAINER_MUTATION_ERROR_CODES,
  type MutationResult,
  type SaveOnboardingStep1Input,
} from "@pulse/domain";

import { saveOnboardingStep1 } from "@/data/trainer/save-trainer-onboarding-step.server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { getMessages } from "@/lib/messages/server";


export type SaveOnboardingStep1State = MutationResult<{ profileId: string }> | null;

function mapSaveError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case TRAINER_MUTATION_ERROR_CODES.VALIDATION:
      return messages.trainer.onboarding.errors.timezoneRequired;
    case TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.trainer.onboarding.errors.unauthorized;
    case TRAINER_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.trainer.onboarding.errors.forbidden;
    default:
      return messages.trainer.onboarding.errors.generic;
  }
}

export async function saveOnboardingStep1Action(
  input: SaveOnboardingStep1Input,
): Promise<SaveOnboardingStep1State> {
  const messages = await getMessages();
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.trainer.onboarding.errors.unauthorized,
    };
  }

  const parsed = saveOnboardingStep1Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.onboarding.errors.timezoneRequired,
    };
  }

  const result = await saveOnboardingStep1(ctx.userId, parsed.data);
  if (!result.ok) {
    return { ...result, message: mapSaveError(result.code, messages) };
  }

  return result;
}
