import { getCalendarDateInTimeZone } from "../check/calendar-date-in-timezone";
import { DELETION_DUE_CALENDAR_DAYS } from "./constants";

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

/** deletion_requests_contract §4 — created_at + 15 calendar days in the school IANA zone. */
export const computeDueOn = (createdAt: Date, schoolTimeZone: string): string => {
  const startDate = getCalendarDateInTimeZone(createdAt, schoolTimeZone);
  return addCalendarDaysToIsoDate(startDate, DELETION_DUE_CALENDAR_DAYS);
};
