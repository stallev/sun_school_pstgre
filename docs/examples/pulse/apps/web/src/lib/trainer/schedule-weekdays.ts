import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { formatDateTime } from "@/lib/i18n/format";

export type ScheduleWeekday = {
  dayOfWeek: number;
  short: string;
  label: string;
};

const MONDAY_REFERENCE_UTC = Date.UTC(2024, 0, 1);

export function getScheduleWeekdays(
  locale: AppLocale = DEFAULT_LOCALE,
): ScheduleWeekday[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const date = new Date(MONDAY_REFERENCE_UTC + dayOfWeek * 86_400_000);
    return {
      dayOfWeek,
      short: formatDateTime(date, { locale, weekday: "short" }).replace(".", ""),
      label: formatDateTime(date, { locale, weekday: "long" }),
    };
  });
}

export function groupIntervalsByDay<T extends { dayOfWeek: number }>(
  intervals: T[],
  locale: AppLocale = DEFAULT_LOCALE,
): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  for (const day of getScheduleWeekdays(locale)) {
    grouped.set(day.dayOfWeek, []);
  }

  for (const interval of intervals) {
    const list = grouped.get(interval.dayOfWeek) ?? [];
    list.push(interval);
    grouped.set(interval.dayOfWeek, list);
  }

  return grouped;
}
