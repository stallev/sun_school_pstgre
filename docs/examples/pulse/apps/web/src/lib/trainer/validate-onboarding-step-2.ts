import {
  saveOnboardingStep2Schema,
  type SaveOnboardingStep2Input,
} from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";

export type OnboardingStep2FieldErrors = {
  bio?: string;
  specializationSlugs?: string;
  experienceYears?: string;
};

function messageForPath(
  path: string,
  code: string,
  messages: Messages,
): string | undefined {
  if (path === "bio") {
    if (code === "too_small") {
      return messages.trainer.onboarding.errors.bioTooShort;
    }
    if (code === "too_big") {
      return messages.trainer.onboarding.errors.bioTooLong;
    }
  }

  if (path === "experienceYears") {
    return messages.trainer.onboarding.errors.experienceInvalid;
  }

  if (path === "specializationSlugs") {
    return messages.trainer.onboarding.errors.specializationsInvalid;
  }

  return undefined;
}

export function validateOnboardingStep2Input(
  input: SaveOnboardingStep2Input,
  messages: Messages,
): OnboardingStep2FieldErrors {
  const parsed = saveOnboardingStep2Schema.safeParse(input);
  if (parsed.success) {
    return {};
  }

  const errors: OnboardingStep2FieldErrors = {};

  for (const issue of parsed.error.issues) {
    const path = issue.path[0];
    if (typeof path !== "string" || path in errors) {
      continue;
    }

    const message =
      messageForPath(path, issue.code, messages) ??
      messages.trainer.onboarding.errors.validation;

    if (path === "bio" || path === "experienceYears" || path === "specializationSlugs") {
      errors[path] = message;
    }
  }

  return errors;
}
