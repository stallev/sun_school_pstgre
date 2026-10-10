"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  parseLocaleInput,
  persistLocale,
} from "@/data/i18n/set-locale.server";
import { getMessages } from "@/lib/messages/server";

export type SetLocaleResult =
  | { ok: true }
  | { ok: false; message: string };

export async function setLocaleAction(
  localeInput: unknown,
): Promise<SetLocaleResult> {
  const messages = await getMessages();
  const locale = parseLocaleInput({ locale: localeInput });

  if (!locale) {
    return { ok: false, message: messages.locale.setError };
  }

  try {
    const session = await auth();
    await persistLocale(locale, session?.user?.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, message: messages.locale.setError };
  }
}

export async function setLocaleFromQueryAction(
  localeInput: unknown,
): Promise<SetLocaleResult> {
  const messages = await getMessages();
    return setLocaleAction(localeInput);
}
