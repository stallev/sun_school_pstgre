"use server";

import {
  saveOnboardingStep4Schema,
  TRAINER_MUTATION_ERROR_CODES,
  type MutationResult,
  type SaveOnboardingStep4Input,
} from "@pulse/domain";

import { saveOnboardingStep4 } from "@/data/trainer/save-trainer-onboarding-step.server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { getMessages } from "@/lib/messages/server";


export type SaveOnboardingStep4State = MutationResult<{ profileId: string }> | null;

export async function saveOnboardingStep4Action(
  input: SaveOnboardingStep4Input,
): Promise<SaveOnboardingStep4State> {
  const messages = await getMessages();
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.trainer.onboarding.errors.unauthorized,
    };
  }

  const parsed = saveOnboardingStep4Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.onboarding.errors.validation,
    };
  }

  const result = await saveOnboardingStep4(ctx.userId, parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message: messages.trainer.onboarding.errors.generic,
    };
  }

  return result;
}
