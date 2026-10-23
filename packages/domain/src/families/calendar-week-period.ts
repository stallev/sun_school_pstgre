import { getCalendarDateInTimeZone } from "../check/calendar-date-in-timezone";

const addCalendarDaysToIsoDate = (isoDate: string, days: number): string => {
  const [yearPart, monthPart, dayPart] = isoDate.split("-");
  if (yearPart === undefined || monthPart === undefined || dayPart === undefined) {
    throw new RangeError(`Invalid ISO date: ${isoDate}`);
  }
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** ISO weekday Mon=1 … Sun=7 for a calendar date (YYYY-MM-DD). */
export const isoWeekdayFromCalendarDate = (isoDate: string): number => {
  const [yearPart, monthPart, dayPart] = isoDate.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
};

/** families §6.6 — Monday `period_start` of the calendar week for `instant` in `schoolTimeZone`. */
export const getCalendarWeekPeriodStart = (instant: Date, schoolTimeZone: string): string => {
  const calendarDate = getCalendarDateInTimeZone(instant, schoolTimeZone);
  const weekday = isoWeekdayFromCalendarDate(calendarDate);
  return addCalendarDaysToIsoDate(calendarDate, -(weekday - 1));
};

/** Inclusive Sunday end date for a Monday `periodStart` (YYYY-MM-DD). */
export const getCalendarWeekPeriodEnd = (periodStart: string): string =>
  addCalendarDaysToIsoDate(periodStart, 6);
