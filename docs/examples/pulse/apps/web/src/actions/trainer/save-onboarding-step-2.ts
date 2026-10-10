"use server";

import {
  saveOnboardingStep2Schema,
  TRAINER_MUTATION_ERROR_CODES,
  type MutationResult,
  type SaveOnboardingStep2Input,
} from "@pulse/domain";

import { saveOnboardingStep2 } from "@/data/trainer/save-trainer-onboarding-step.server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { getMessages } from "@/lib/messages/server";


export type SaveOnboardingStep2State = MutationResult<{ profileId: string }> | null;

export async function saveOnboardingStep2Action(
  input: SaveOnboardingStep2Input,
): Promise<SaveOnboardingStep2State> {
  const messages = await getMessages();
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.trainer.onboarding.errors.unauthorized,
    };
  }

  const parsed = saveOnboardingStep2Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.onboarding.errors.validation,
    };
  }

  const result = await saveOnboardingStep2(ctx.userId, parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message: messages.trainer.onboarding.errors.generic,
    };
  }

  return result;
}
