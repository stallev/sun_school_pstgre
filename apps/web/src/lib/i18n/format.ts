import { type AppLocale } from "@sunschool/domain";

import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";

export const appLocaleToIntlLocale = (locale: AppLocale): "en-GB" | "ru-RU" =>
  locale === "EN" ? "en-GB" : "ru-RU";

export const messageLocaleToIntlLocale = (locale: MessageLocale): "en-GB" | "ru-RU" =>
  appLocaleToIntlLocale(messageLocaleToAppLocale(locale));

const resolveIntlLocale = (locale: MessageLocale | AppLocale): "en-GB" | "ru-RU" =>
  locale === "ru" || locale === "en"
    ? messageLocaleToIntlLocale(locale)
    : appLocaleToIntlLocale(locale);

export type FormatDateTimeOptions = {
  locale: MessageLocale | AppLocale;
  timeZone?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  weekday?: "long" | "short" | "narrow";
  month?: "long" | "short" | "narrow" | "numeric" | "2-digit";
  day?: "numeric" | "2-digit";
  year?: "numeric" | "2-digit";
  hour?: "numeric" | "2-digit";
  minute?: "numeric" | "2-digit";
};

/** Dates and times with UI locale and school time zone (ADR-008 §4.4, ADR-004). */
export function formatDateTime(
  date: Date | string | number,
  options: FormatDateTimeOptions,
): string {
  const value = date instanceof Date ? date : new Date(date);
  const intlLocale = resolveIntlLocale(options.locale);

  if (options.dateStyle || options.timeStyle) {
    return new Intl.DateTimeFormat(intlLocale, {
      dateStyle: options.dateStyle,
      timeStyle: options.timeStyle,
      timeZone: options.timeZone,
    }).format(value);
  }

  return new Intl.DateTimeFormat(intlLocale, {
    weekday: options.weekday,
    month: options.month,
    day: options.day,
    year: options.year,
    hour: options.hour,
    minute: options.minute,
    timeZone: options.timeZone,
  }).format(value);
}

export function formatNumber(
  value: number,
  locale: MessageLocale | AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), options).format(value);
}

export function formatPercent(
  value: number,
  locale: MessageLocale | AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "percent",
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}
