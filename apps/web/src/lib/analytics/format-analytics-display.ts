import type { PluralForms } from "@/lib/messages/plural";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import {
  formatAnalyticsAxisNumber,
  formatPercentAxisTick,
} from "@/lib/analytics/chart-scale";
import { formatDecimalOne, formatNumber, plural } from "@/lib/i18n/format";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsYearMessages } from "@/lib/messages/analytics-messages";

export type YearComparisonMetric = "attendance" | "verses" | "test" | "notebook";

/** Domain attendance rate 0–1 → display percent (e.g. 0.8 → `80%`). */
export const formatAnalyticsPercent = (template: string, rate: number): string => {
  const percent = Math.round(rate * 100);
  return fillMessage(template, { value: percent });
};

/** R-23 / R-25: chart Y-axis — `formatNumber` only (comma in ru); percent via template. */
export const formatAnalyticsChartAxisTick = (
  percentTemplate: string,
  rawValue: number,
  locale: MessageLocale,
  kind: "percent" | "score",
): string => {
  if (kind === "percent") {
    return formatPercentAxisTick(percentTemplate, rawValue, locale);
  }
  return formatAnalyticsAxisNumber(rawValue, locale);
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
  const formattedValue = formatDecimalOne(value, locale);
  const base = plural(lessonsObservedForms, observationCount, locale);
  return fillMessage(template, { value: formattedValue, base });
};

export const formatAnalyticsShortDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

export const formatAnalyticsDelta = (value: number, locale: MessageLocale): string => {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const formatted = formatDecimalOne(Math.abs(value), locale);
  return `${sign}${formatted}`;
};

export const formatYearComparisonAmount = (
  metric: YearComparisonMetric,
  delta: number,
  locale: MessageLocale,
): string => {
  const abs = Math.abs(delta);
  if (metric === "attendance") {
    return `${formatNumber(abs, locale, { maximumFractionDigits: 0 })}%`;
  }
  return formatDecimalOne(abs, locale);
};

export const formatYearComparisonDiff = (
  metric: YearComparisonMetric,
  delta: number,
  messages: Pick<AnalyticsYearMessages, "diffHigher" | "diffLower" | "diffSame">,
  locale: MessageLocale,
): string => {
  if (delta === 0) return messages.diffSame;
  const amount = formatYearComparisonAmount(metric, delta, locale);
  const template = delta > 0 ? messages.diffHigher : messages.diffLower;
  return fillMessage(template, { amount });
};
