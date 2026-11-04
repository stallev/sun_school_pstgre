import type { AppLocale } from "@sunschool/domain";
import { formatDateTime } from "@/lib/i18n/format";

const monthKeyToUtcDate = (monthKey: string): Date => {
  const [yearPart, monthPart] = monthKey.split("-");
  return new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, 1));
};

const capitalizeMonthToken = (month: string, locale: AppLocale): string => {
  if (locale === "EN") return month;
  return month.charAt(0).toUpperCase() + month.slice(1);
};

/** Standalone month name for arrow `aria-label` («Октябрь», «December»). */
export const formatCalendarMonthName = (monthKey: string, locale: AppLocale): string => {
  const raw = formatDateTime(monthKeyToUtcDate(monthKey), {
    locale,
    month: "long",
    timeZone: "UTC",
  });
  return capitalizeMonthToken(raw, locale);
};

/** «Ноябрь 2026» — title between month navigation arrows. */
export const formatCalendarMonthTitle = (monthKey: string, locale: AppLocale): string => {
  const [yearPart] = monthKey.split("-");
  return `${formatCalendarMonthName(monthKey, locale)} ${yearPart}`;
};
