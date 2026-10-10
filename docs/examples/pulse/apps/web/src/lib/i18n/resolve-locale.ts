import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { parseAcceptLanguage } from "@/lib/i18n/accept-language";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_REQUEST_HEADER,
  type AppLocale,
} from "@/lib/i18n/constants";
import { readLocaleCookie } from "@/lib/i18n/cookie";

export type ResolveLocaleOptions = {
  sessionLocale?: string | null;
};

async function resolveLocaleInternal(
  options: ResolveLocaleOptions = {},
): Promise<AppLocale> {
  const cookieLocale = await readLocaleCookie();

  if (cookieLocale) {
    return cookieLocale;
  }

  if (isAppLocale(options.sessionLocale)) {
    return options.sessionLocale;
  }

  const headerLocale = (await headers()).get(LOCALE_REQUEST_HEADER);
  if (isAppLocale(headerLocale)) {
    return headerLocale;
  }

  const acceptLanguage = (await headers()).get("accept-language");
  return parseAcceptLanguage(acceptLanguage);
}

export const resolveLocale = cache(resolveLocaleInternal);

export { parseAcceptLanguage };
