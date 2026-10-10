import "server-only";

import { cache } from "react";

import { type AppLocale } from "@/lib/i18n/constants";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

import { getMessagesForLocale } from "./locale-catalog";

export const getLocale = cache(async () => resolveLocale());

export async function getMessages(locale?: AppLocale) {
  const activeLocale = locale ?? (await getLocale());
  return getMessagesForLocale(activeLocale);
}
