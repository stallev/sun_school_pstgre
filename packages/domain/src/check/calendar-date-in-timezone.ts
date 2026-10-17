/** ADR-004 — calendar date (YYYY-MM-DD) for an instant in the school IANA time zone. */
export const getCalendarDateInTimeZone = (instant: Date, timeZone: string): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
};
