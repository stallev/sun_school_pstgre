import { getCalendarDateInTimeZone } from "./calendar-date-in-timezone";

/** homework_check_contract §7, ADR-004 §4 п. 5 — `late` is not recomputed when the zone changes. */
export const computeLate = (
  setAt: Date,
  nextLessonDate: string | null,
  schoolTimeZone: string,
): boolean => {
  if (nextLessonDate === null) {
    return false;
  }
  const setAtDate = getCalendarDateInTimeZone(setAt, schoolTimeZone);
  return setAtDate > nextLessonDate;
};
