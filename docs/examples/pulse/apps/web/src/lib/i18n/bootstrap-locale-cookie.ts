import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseAcceptLanguage } from "@/lib/i18n/accept-language";
import {
  isAppLocale,
  LOCALE_COOKIE_NAME,
  LOCALE_REQUEST_HEADER,
  type AppLocale,
} from "@/lib/i18n/constants";

const ONE_YEAR_SECONDS = 31_536_000;

const localeCookieOptions = {
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: false,
};

export function readRequestLocaleCookie(
  request: NextRequest,
): AppLocale | null {
  const value = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  return isAppLocale(value) ? value : null;
}

function resolveBootstrapLocale(
  request: NextRequest,
  sessionLocale?: string | null,
): AppLocale {
  if (isAppLocale(sessionLocale)) {
    return sessionLocale;
  }

  return parseAcceptLanguage(request.headers.get("accept-language"));
}

export type BootstrapLocaleOptions = {
  sessionLocale?: string | null;
};

export function bootstrapLocaleCookie(
  request: NextRequest,
  options: BootstrapLocaleOptions = {},
): NextResponse {
  if (readRequestLocaleCookie(request)) {
    return NextResponse.next();
  }

  const locale = resolveBootstrapLocale(request, options.sessionLocale);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER, locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, localeCookieOptions);
  return response;
}

export function redirectWithLocaleCookie(
  request: NextRequest,
  url: URL,
  options: BootstrapLocaleOptions = {},
): NextResponse {
  if (readRequestLocaleCookie(request)) {
    return NextResponse.redirect(url);
  }

  const locale = resolveBootstrapLocale(request, options.sessionLocale);
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE_NAME, locale, localeCookieOptions);
  return response;
}
