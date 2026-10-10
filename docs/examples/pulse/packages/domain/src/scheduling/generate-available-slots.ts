import { Temporal } from "@js-temporal/polyfill";

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

function parseLocalTime(value: string): { hour: number; minute: number } {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid local time: ${value}`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error(`Invalid local time: ${value}`);
  }

  return { hour, minute };
}

function temporalDayToSchemaDay(dayOfWeek: number): number {
  return dayOfWeek - 1;
}

function isBlockedDate(
  date: Temporal.PlainDate,
  exceptions: { exceptionDate: string; isBlocked: boolean }[],
): boolean {
  const isoDate = date.toString();
  return exceptions.some(
    (item) => item.exceptionDate === isoDate && item.isBlocked,
  );
}

function intervalsForDate(
  date: Temporal.PlainDate,
  intervals: { dayOfWeek: number; startTime: string; endTime: string }[],
) {
  const schemaDay = temporalDayToSchemaDay(date.dayOfWeek);
  return intervals.filter((item) => item.dayOfWeek === schemaDay);
}

function overlapsBooking(
  slotStart: Temporal.Instant,
  slotEnd: Temporal.Instant,
  bookings: { startsAtUtc: string; durationMinutes: number }[],
): boolean {
  for (const booking of bookings) {
    const bookingStart = Temporal.Instant.from(booking.startsAtUtc);
    const bookingEnd = bookingStart.add({
      minutes: booking.durationMinutes,
    });

    if (
      Temporal.Instant.compare(slotStart, bookingEnd) < 0 &&
      Temporal.Instant.compare(slotEnd, bookingStart) > 0
    ) {
      return true;
    }
  }

  return false;
}

function formatLocalLabel(zoned: Temporal.ZonedDateTime): string {
  return zoned.toPlainTime().toString({ smallestUnit: "minute" });
}

export function generateAvailableSlots(input: {
  timezone: string;
  intervals: { dayOfWeek: number; startTime: string; endTime: string }[];
  exceptions: { exceptionDate: string; isBlocked: boolean }[];
  bookings: { startsAtUtc: string; durationMinutes: number }[];
  range: { fromLocalDate: string; toLocalDate: string };
  slotDurationMinutes: number;
  now?: Date;
}): import("../types/slot-dto").SlotDto[] {
  const {
    timezone,
    intervals,
    exceptions,
    bookings,
    range,
    slotDurationMinutes,
    now = new Date(),
  } = input;

  if (slotDurationMinutes <= 0) {
    return [];
  }

  const nowInstant = Temporal.Instant.from(now.toISOString());
  const fromDate = Temporal.PlainDate.from(range.fromLocalDate);
  const toDate = Temporal.PlainDate.from(range.toLocalDate);

  if (Temporal.PlainDate.compare(fromDate, toDate) > 0) {
    return [];
  }

  const slots: import("../types/slot-dto").SlotDto[] = [];
  let cursor = fromDate;

  while (Temporal.PlainDate.compare(cursor, toDate) <= 0) {
    if (!isBlockedDate(cursor, exceptions)) {
      for (const interval of intervalsForDate(cursor, intervals)) {
        const startParts = parseLocalTime(interval.startTime);
        const endParts = parseLocalTime(interval.endTime);
        const dayStart = cursor.toPlainDateTime({
          hour: startParts.hour,
          minute: startParts.minute,
        });
        const dayEnd = cursor.toPlainDateTime({
          hour: endParts.hour,
          minute: endParts.minute,
        });

        if (Temporal.PlainDateTime.compare(dayStart, dayEnd) >= 0) {
          continue;
        }

        let slotStartLocal = dayStart;
        while (true) {
          const slotEndLocal = slotStartLocal.add({
            minutes: slotDurationMinutes,
          });
          if (Temporal.PlainDateTime.compare(slotEndLocal, dayEnd) > 0) {
            break;
          }

          const zonedStart = slotStartLocal.toZonedDateTime(timezone);
          const slotStartInstant = zonedStart.toInstant();
          const slotEndInstant = slotStartInstant.add({
            minutes: slotDurationMinutes,
          });

          if (
            Temporal.Instant.compare(slotStartInstant, nowInstant) > 0 &&
            !overlapsBooking(slotStartInstant, slotEndInstant, bookings)
          ) {
            slots.push({
              startsAtUtc: slotStartInstant.toString(),
              durationMinutes: slotDurationMinutes,
              localLabel: formatLocalLabel(zonedStart),
            });
          }

          slotStartLocal = slotStartLocal.add({
            minutes: slotDurationMinutes,
          });
        }
      }
    }

    cursor = cursor.add({ days: 1 });
  }

  slots.sort((left, right) =>
    Temporal.Instant.compare(
      Temporal.Instant.from(left.startsAtUtc),
      Temporal.Instant.from(right.startsAtUtc),
    ),
  );

  return slots;
}

export function getLocalDateRangeFromToday(
  timezone: string,
  dayCount: number,
  now = new Date(),
): { fromLocalDate: string; toLocalDate: string } {
  const zonedNow = Temporal.Instant.from(now.toISOString()).toZonedDateTimeISO(
    timezone,
  );
  const fromDate = zonedNow.toPlainDate();
  const toDate = fromDate.add({ days: Math.max(dayCount - 1, 0) });

  return {
    fromLocalDate: fromDate.toString(),
    toLocalDate: toDate.toString(),
  };
}

export function listLocalDatesFromToday(
  timezone: string,
  dayCount: number,
  now = new Date(),
): string[] {
  const { fromLocalDate, toLocalDate } = getLocalDateRangeFromToday(
    timezone,
    dayCount,
    now,
  );
  const dates: string[] = [];
  let cursor = Temporal.PlainDate.from(fromLocalDate);
  const toDate = Temporal.PlainDate.from(toLocalDate);

  while (Temporal.PlainDate.compare(cursor, toDate) <= 0) {
    dates.push(cursor.toString());
    cursor = cursor.add({ days: 1 });
  }

  return dates;
}

