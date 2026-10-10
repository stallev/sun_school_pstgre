import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";

import { enMessages } from "./en";
import { ruMessages } from "./ru";
import type { Messages } from "./types";

export type { Messages } from "./types";

const messagesByLocale: Record<AppLocale, Messages> = {
  en: enMessages,
  ru: ruMessages,
};

export function getMessagesForLocale(locale: AppLocale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}

/**
 * @deprecated Use `getMessages()` from `@/lib/messages/server` or `useMessages()` on the client.
 * Bare `MESSAGES` always resolves to Russian and ignores active locale.
 */
export const MESSAGES = ruMessages;
