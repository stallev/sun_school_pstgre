import type { AppLocale } from "@sunschool/domain";

import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { messageLocaleToIntlLocale, appLocaleToIntlLocale } from "@/lib/i18n/format";
import {
  formatDateToIsoDateOnly,
  parseIsoDateOnlyToLocalDate,
} from "@/lib/date/iso-date";

const resolveIntlLocale = (locale: MessageLocale | AppLocale): "en-GB" | "ru-RU" =>
  locale === "ru" || locale === "en"
    ? messageLocaleToIntlLocale(locale)
    : appLocaleToIntlLocale(locale);

/** Display ISO `yyyy-MM-dd` in the UI locale (not the browser default). */
export function formatIsoDateForLocale(
  iso: string,
  locale: MessageLocale | AppLocale,
): string {
  const date = parseIsoDateOnlyToLocalDate(iso);
  if (!date) return "";
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getDateInputPlaceholder(locale: MessageLocale | AppLocale): string {
  const intlLocale = resolveIntlLocale(locale);
  const parts = new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(2026, 0, 15));
  return parts
    .map((part) => {
      if (part.type === "day") return "dd";
      if (part.type === "month") return "mm";
      if (part.type === "year") return "yyyy";
      return part.value;
    })
    .join("");
}

type ParseLocaleDateResult = {
  iso: string | null;
  isCompleteInvalid: boolean;
};

const splitDateTokens = (text: string): number[] | null => {
  const normalized = text.trim().replace(/[/-]/g, ".");
  const parts = normalized.split(".").map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 3) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums;
};

/** Parses locale-shaped typed input into ISO or flags an invalid complete date. */
export function parseLocaleDateInput(
  text: string,
  locale: MessageLocale | AppLocale,
): ParseLocaleDateResult {
  const trimmed = text.trim();
  if (!trimmed) return { iso: null, isCompleteInvalid: false };

  const isoDirect = parseIsoDateOnlyToLocalDate(trimmed);
  if (isoDirect) return { iso: formatDateToIsoDateOnly(isoDirect), isCompleteInvalid: false };

  const tokens = splitDateTokens(trimmed);
  if (!tokens) return { iso: null, isCompleteInvalid: trimmed.length > 0 };

  const intlLocale = resolveIntlLocale(locale);
  const sample = new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(2026, 10, 24));
  const order = sample
    .filter((part) => part.type === "day" || part.type === "month" || part.type === "year")
    .map((part) => part.type);

  const values: Record<"day" | "month" | "year", number> = {
    day: 0,
    month: 0,
    year: 0,
  };
  order.forEach((type, index) => {
    if (type !== "day" && type !== "month" && type !== "year") return;
    const token = tokens[index];
    if (token === undefined) return;
    values[type] = token;
  });

  const day = values.day;
  const month = values.month;
  let year = values.year;
  if (year < 100) year += 2000;

  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!valid) return { iso: null, isCompleteInvalid: true };
  return { iso: formatDateToIsoDateOnly(date), isCompleteInvalid: false };
}
