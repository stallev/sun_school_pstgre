export const DEFAULT_LOCALE = "en" as const;

export const SUPPORTED_LOCALES = ["en", "ru"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_COOKIE_NAME = "pulse_locale";

/** Injected by proxy on first visit so RSC can read detected locale in the same request. */
export const LOCALE_REQUEST_HEADER = "x-pulse-locale";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "ru";
}
