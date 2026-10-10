import type { SlotDto } from "@pulse/domain";

import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { formatDateTime } from "@/lib/i18n/format";

export type ScheduleDayGroup = {
  localDate: string;
  dayLabel: string;
  slots: SlotDto[];
};

function getLocalDateKey(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoUtc));
}

function formatDayLabel(
  isoUtc: string,
  timezone: string,
  locale: AppLocale,
): string {
  return formatDateTime(isoUtc, {
    locale,
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
  });
}

export function groupScheduleSlotsByDay(
  timezone: string,
  slots: SlotDto[],
  locale: AppLocale = DEFAULT_LOCALE,
): ScheduleDayGroup[] {
  const groups = new Map<string, SlotDto[]>();

  for (const slot of slots) {
    const key = getLocalDateKey(slot.startsAtUtc, timezone);
    const existing = groups.get(key) ?? [];
    existing.push(slot);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([localDate, daySlots]) => ({
    localDate,
    dayLabel: formatDayLabel(
      daySlots[0]?.startsAtUtc ?? `${localDate}T12:00:00Z`,
      timezone,
      locale,
    ),
    slots: daySlots,
  }));
}
