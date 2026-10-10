import { SCHEDULE_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { WeeklyIntervalInput } from "../types/slot-dto";

import { parseLocalTimeToMinutes } from "./parse-local-time";

export type ValidateWeeklyIntervalsError = {
  code: (typeof SCHEDULE_MUTATION_ERROR_CODES)[keyof typeof SCHEDULE_MUTATION_ERROR_CODES];
};

type ParsedInterval = WeeklyIntervalInput & {
  startMinutes: number;
  endMinutes: number;
};

function parseInterval(
  interval: WeeklyIntervalInput,
): ParsedInterval | ValidateWeeklyIntervalsError {
  const startMinutes = parseLocalTimeToMinutes(interval.startTime);
  const endMinutes = parseLocalTimeToMinutes(interval.endTime);

  if (startMinutes === null || endMinutes === null) {
    return { code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION };
  }

  if (endMinutes <= startMinutes) {
    return { code: SCHEDULE_MUTATION_ERROR_CODES.INVALID_INTERVAL };
  }

  return {
    ...interval,
    startMinutes,
    endMinutes,
  };
}

function intervalsOverlap(left: ParsedInterval, right: ParsedInterval): boolean {
  return (
    left.startMinutes < right.endMinutes &&
    right.startMinutes < left.endMinutes
  );
}

export function validateWeeklyIntervals(
  intervals: WeeklyIntervalInput[],
): ValidateWeeklyIntervalsError | null {
  const byDay = new Map<number, ParsedInterval[]>();

  for (const interval of intervals) {
    if (interval.dayOfWeek < 0 || interval.dayOfWeek > 6) {
      return { code: SCHEDULE_MUTATION_ERROR_CODES.VALIDATION };
    }

    const parsed = parseInterval(interval);
    if ("code" in parsed) {
      return parsed;
    }

    const dayIntervals = byDay.get(interval.dayOfWeek) ?? [];
    dayIntervals.push(parsed);
    byDay.set(interval.dayOfWeek, dayIntervals);
  }

  for (const dayIntervals of byDay.values()) {
    dayIntervals.sort((left, right) => left.startMinutes - right.startMinutes);

    for (let index = 1; index < dayIntervals.length; index += 1) {
      if (intervalsOverlap(dayIntervals[index - 1]!, dayIntervals[index]!)) {
        return { code: SCHEDULE_MUTATION_ERROR_CODES.INTERVAL_OVERLAP };
      }
    }
  }

  return null;
}
