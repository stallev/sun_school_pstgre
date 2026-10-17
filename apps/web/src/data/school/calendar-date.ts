/** Parse `YYYY-MM-DD` to UTC midnight for Prisma `@db.Date` columns. */
export const calendarDateFromIso = (iso: string): Date => {
  const parts = iso.split("-");
  const year = Number.parseInt(parts[0] ?? "", 10);
  const month = Number.parseInt(parts[1] ?? "", 10);
  const day = Number.parseInt(parts[2] ?? "", 10);
  return new Date(Date.UTC(year, month - 1, day));
};

export const isoFromCalendarDate = (value: Date): string => value.toISOString().slice(0, 10);

/** Subtract whole calendar days from an ISO date (`YYYY-MM-DD`). */
export const subtractCalendarDays = (iso: string, days: number): string => {
  const date = calendarDateFromIso(iso);
  date.setUTCDate(date.getUTCDate() - days);
  return isoFromCalendarDate(date);
};
