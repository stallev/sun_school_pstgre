import { z } from "zod";
import { calendarDateFromIso, isoFromCalendarDate } from "../school/calendar-date";

export const analyticsPeriodFilterSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("year"),
    academicYearId: z.string().uuid(),
  }),
  z.object({
    mode: z.literal("month"),
    academicYearId: z.string().uuid(),
    month: z.string().regex(/^\d{4}-\d{2}$/),
  }),
  z.object({
    mode: z.literal("range"),
    academicYearId: z.string().uuid(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
]);

export type AnalyticsPeriodFilter = z.infer<typeof analyticsPeriodFilterSchema>;

export type ResolvedAnalyticsPeriod = {
  academicYearId: string;
  fromIso: string;
  toIso: string;
};

const clampIso = (value: string, minIso: string, maxIso: string): string => {
  if (value < minIso) return minIso;
  if (value > maxIso) return maxIso;
  return value;
};

export const resolveAnalyticsPeriodBounds = (
  filter: AnalyticsPeriodFilter,
  yearStartsOn: Date,
  yearEndsOn: Date,
): ResolvedAnalyticsPeriod => {
  const yearFrom = isoFromCalendarDate(yearStartsOn);
  const yearTo = isoFromCalendarDate(yearEndsOn);

  if (filter.mode === "year") {
    return { academicYearId: filter.academicYearId, fromIso: yearFrom, toIso: yearTo };
  }

  if (filter.mode === "month") {
    const [yearPart, monthPart] = filter.month.split("-");
    const monthStart = `${yearPart}-${monthPart}-01`;
    const monthEndDate = calendarDateFromIso(monthStart);
    monthEndDate.setUTCMonth(monthEndDate.getUTCMonth() + 1);
    monthEndDate.setUTCDate(0);
    const monthEnd = isoFromCalendarDate(monthEndDate);
    return {
      academicYearId: filter.academicYearId,
      fromIso: clampIso(monthStart, yearFrom, yearTo),
      toIso: clampIso(monthEnd, yearFrom, yearTo),
    };
  }

  const fromIso = clampIso(filter.from, yearFrom, yearTo);
  const toIso = clampIso(filter.to, yearFrom, yearTo);
  return {
    academicYearId: filter.academicYearId,
    fromIso: fromIso <= toIso ? fromIso : toIso,
    toIso: fromIso <= toIso ? toIso : fromIso,
  };
};
