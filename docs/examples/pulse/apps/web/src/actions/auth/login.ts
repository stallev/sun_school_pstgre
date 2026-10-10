"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import {
  AUTH_MUTATION_ERROR_CODES,
  type MutationResult,
} from "@pulse/domain";

import { signIn } from "@/auth";
import { verifyUserCredentials } from "@/data/auth/verify-user-credentials.server";
import { resolveSafeCallbackUrl } from "@/lib/auth/safe-callback-url";
import { getMessages } from "@/lib/messages/server";


export type LoginFormState = MutationResult | null;

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const messages = await getMessages();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim() || null;

  const verifiedUser = await verifyUserCredentials({ email, password });
  if (!verifiedUser) {
    return {
      ok: false,
      code: AUTH_MUTATION_ERROR_CODES.INVALID_CREDENTIALS,
      message: messages.auth.login.invalidCredentials,
    };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error || result?.ok === false) {
      return {
        ok: false,
        code: AUTH_MUTATION_ERROR_CODES.INVALID_CREDENTIALS,
        message: messages.auth.login.invalidCredentials,
      };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: AUTH_MUTATION_ERROR_CODES.INVALID_CREDENTIALS,
        message: messages.auth.login.invalidCredentials,
      };
    }

    throw error;
  }

  redirect(
    resolveSafeCallbackUrl(callbackUrl, verifiedUser.role),
  );
}
