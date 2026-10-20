import { fillMessage } from "@/lib/messages/fill-message";

export const formatAnalyticsPercent = (template: string, value: number): string =>
  fillMessage(template, { value });

export const formatAnalyticsAverage = (template: string, value: number): string =>
  fillMessage(template, { value });

export const formatAnalyticsChartValue = (
  template: string,
  empty: string,
  value: number | null,
  observationCount: number,
): string => {
  if (value === null) return empty;
  return fillMessage(template, { value, n: observationCount });
};

export const formatAnalyticsShortDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

export const formatAnalyticsDelta = (value: number): string => {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}`;
};
