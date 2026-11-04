import { getCalendarDateInTimeZone } from "@sunschool/domain";

export const shiftCalendarMonthKey = (monthKey: string, delta: number): string => {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const resolveCalendarMonthKey = (
  raw: string | null | undefined,
  timeZone: string,
  now: Date = new Date(),
): string => {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  return getCalendarDateInTimeZone(now, timeZone).slice(0, 7);
};

export const todayMonthKeyInTimeZone = (timeZone: string, now: Date = new Date()): string =>
  getCalendarDateInTimeZone(now, timeZone).slice(0, 7);

export const todayIsoInTimeZone = (timeZone: string, now: Date = new Date()): string =>
  getCalendarDateInTimeZone(now, timeZone);
