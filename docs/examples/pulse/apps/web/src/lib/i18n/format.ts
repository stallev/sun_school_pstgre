import { formatDistanceToNow } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns/locale";

import { type AppLocale } from "@/lib/i18n/constants";

export function getIntlLocale(locale: AppLocale): "en-US" | "ru-RU" {
  return locale === "ru" ? "ru-RU" : "en-US";
}

export function getOgLocale(locale: AppLocale): "en_US" | "ru_RU" {
  return locale === "ru" ? "ru_RU" : "en_US";
}

export function getDateFnsLocale(locale: AppLocale): DateFnsLocale {
  return locale === "ru" ? ru : enUS;
}

export function formatMoney(
  amountCents: number,
  currency = "USD",
  locale: AppLocale = "en",
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export type FormatDateTimeOptions = {
  locale: AppLocale;
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

export function formatDateTime(
  date: Date | string | number,
  options: FormatDateTimeOptions,
): string {
  const value = date instanceof Date ? date : new Date(date);
  const intlLocale = getIntlLocale(options.locale);

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

export function formatRelative(
  date: Date | string | number,
  locale: AppLocale,
): string {
  const value = date instanceof Date ? date : new Date(date);
  return formatDistanceToNow(value, {
    addSuffix: true,
    locale: getDateFnsLocale(locale),
  });
}

export function formatNumber(
  value: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}
