import type { PluralForms } from "@/lib/messages/plural";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { formatNumber, plural } from "@/lib/i18n/format";
import { fillMessage } from "@/lib/messages/fill-message";

/** Domain attendance rate 0–1 → display percent (e.g. 0.8 → `80%`). */
export const formatAnalyticsPercent = (template: string, rate: number): string => {
  const percent = Math.round(rate * 100);
  return fillMessage(template, { value: percent });
};

export const formatAnalyticsAttendanceRate = (
  template: string,
  rate: number | null,
  empty: string,
): string => {
  if (rate === null || Number.isNaN(rate)) return empty;
  return formatAnalyticsPercent(template, rate);
};

export const formatAnalyticsAverage = (template: string, value: number | string): string =>
  fillMessage(template, { value });

export const formatAnalyticsChartValue = (
  template: string,
  empty: string,
  value: number | null,
  observationCount: number,
  lessonsObservedForms: PluralForms,
  locale: MessageLocale,
): string => {
  if (value === null) return empty;
  const formattedValue = formatNumber(
    Number(value.toFixed(1)),
    locale,
    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  );
  const base = plural(lessonsObservedForms, observationCount, locale);
  return fillMessage(template, { value: formattedValue, base });
};

export const formatAnalyticsShortDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

export const formatAnalyticsDelta = (value: number, locale: MessageLocale): string => {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const formatted = formatNumber(Math.abs(value), locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${sign}${formatted}`;
};
