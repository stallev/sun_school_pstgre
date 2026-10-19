import { calendarDateFromIso } from "../dates/calendar-date";

export type ResolvedAnalyticsPeriod = {
  academicYearId: string;
  fromIso: string;
  toIso: string;
};

export const periodDateRange = (period: ResolvedAnalyticsPeriod): { gte: Date; lte: Date } => ({
  gte: calendarDateFromIso(period.fromIso),
  lte: calendarDateFromIso(period.toIso),
});
