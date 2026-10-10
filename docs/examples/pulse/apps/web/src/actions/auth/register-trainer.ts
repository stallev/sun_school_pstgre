"use server";

import {
  AUTH_MUTATION_ERROR_CODES,
  TRAINER_MUTATION_ERROR_CODES,
  registerTrainerSchema,
  type MutationResult,
} from "@pulse/domain";

import { signIn } from "@/auth";
import { registerTrainerUser } from "@/data/trainer/register-trainer.server";
import { getLocale, getMessages } from "@/lib/messages/server";

export type RegisterTrainerFormState = MutationResult<{ step: 1 }> | null;

export async function registerTrainerAction(
  _prevState: RegisterTrainerFormState,
  formData: FormData,
): Promise<RegisterTrainerFormState> {
  const messages = await getMessages();
  const acceptedTerms = formData.get("acceptedTerms") === "on";
  if (!acceptedTerms) {
    return {
      ok: false,
      code: AUTH_MUTATION_ERROR_CODES.TERMS_REQUIRED,
      message: messages.auth.register.termsRequired,
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (password !== confirmPassword) {
    return {
      ok: false,
      code: AUTH_MUTATION_ERROR_CODES.PASSWORD_MISMATCH,
      message: messages.auth.register.passwordMismatch,
    };
  }

  const parsed = registerTrainerSchema.safeParse({ email, password, fullName });
  if (!parsed.success) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.auth.register.validationError,
    };
  }

  const locale = await getLocale();
  const result = await registerTrainerUser(parsed.data, locale);
  if (!result.ok) {
    if (result.code === TRAINER_MUTATION_ERROR_CODES.DUPLICATE_EMAIL) {
      return {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.DUPLICATE_EMAIL,
        message: messages.auth.register.duplicateEmail,
      };
    }

    return {
      ok: false,
      code: result.code,
      message: messages.trainer.onboarding.errors.generic,
    };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });

  return { ok: true, data: { step: 1 } };
}
