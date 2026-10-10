import { Temporal } from "@js-temporal/polyfill";

function formatUtcOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const mins = absolute % 60;

  if (mins === 0) {
    return `UTC${sign}${hours}`;
  }

  return `UTC${sign}${hours}:${String(mins).padStart(2, "0")}`;
}

export function formatTrainerTimezoneLabel(
  timezone: string,
  now = new Date(),
): string {
  try {
    const zoned = Temporal.Instant.from(now.toISOString()).toZonedDateTimeISO(
      timezone,
    );
    const offsetMinutes = zoned.offsetNanoseconds / 60_000_000_000;
    return `${timezone} (${formatUtcOffset(offsetMinutes)})`;
  } catch {
    return timezone;
  }
}
