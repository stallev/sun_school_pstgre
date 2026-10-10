"use server";

import {
  submitTrainerApplicationSchema,
  TRAINER_MUTATION_ERROR_CODES,
  type MutationResult,
} from "@pulse/domain";

import { submitTrainerApplicationWithRedirect } from "@/data/trainer/submit-trainer-application.server";
import { getMessages } from "@/lib/messages/server";


export type SubmitTrainerApplicationFormState =
  | MutationResult<{ profileId: string }>
  | null;

function mapSubmitError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case TRAINER_MUTATION_ERROR_CODES.APPLICATION_INCOMPLETE:
      return messages.trainer.onboarding.errors.incomplete;
    case TRAINER_MUTATION_ERROR_CODES.ALREADY_APPROVED:
      return messages.trainer.onboarding.errors.alreadyApproved;
    case TRAINER_MUTATION_ERROR_CODES.VALIDATION:
      return messages.trainer.onboarding.errors.termsRequired;
    default:
      return messages.trainer.onboarding.errors.generic;
  }
}

export async function submitTrainerApplicationAction(
  _prevState: SubmitTrainerApplicationFormState,
  formData: FormData,
): Promise<SubmitTrainerApplicationFormState> {
  const messages = await getMessages();
  const acceptedTerms = formData.get("acceptedTerms") === "on";

  const parsed = submitTrainerApplicationSchema.safeParse({
    acceptedTerms: acceptedTerms ? true : undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.trainer.onboarding.errors.termsRequired,
    };
  }

  const result = await submitTrainerApplicationWithRedirect(parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message: mapSubmitError(result.code, messages),
    };
  }

  return result;
}
