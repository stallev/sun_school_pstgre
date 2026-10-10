import "server-only";

import { cookies } from "next/headers";

import {
  isAppLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/lib/i18n/constants";

const ONE_YEAR_SECONDS = 31_536_000;

export async function readLocaleCookie(): Promise<AppLocale | null> {
  const value = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  return isAppLocale(value) ? value : null;
}

export async function writeLocaleCookie(locale: AppLocale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}
