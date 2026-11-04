import { subtractCalendarDays } from "@/data/school/calendar-date";
import { formatDateTime } from "@/lib/i18n/format";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type RelativeDayMessages = {
  today: string;
  yesterday: string;
  onDate: string;
};

export const calendarDayInTimeZone = (instant: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

export type FormatRelativeCalendarDayOptions = {
  instantIso: string;
  schoolTimeZone: string;
  locale: MessageLocale;
  messages: RelativeDayMessages;
  now?: Date;
};

/** Calendar-day label in the school time zone (ADR-020 D-14). */
export const formatRelativeCalendarDay = ({
  instantIso,
  schoolTimeZone,
  locale,
  messages,
  now = new Date(),
}: FormatRelativeCalendarDayOptions): string => {
  const instant = new Date(instantIso);
  const eventDay = calendarDayInTimeZone(instant, schoolTimeZone);
  const todayDay = calendarDayInTimeZone(now, schoolTimeZone);
  const yesterdayDay = subtractCalendarDays(todayDay, 1);

  if (eventDay === todayDay) return messages.today;
  if (eventDay === yesterdayDay) return messages.yesterday;

  const dateLabel = formatDateTime(instant, {
    locale,
    timeZone: schoolTimeZone,
    day: "numeric",
    month: "short",
  });
  return messages.onDate.replace("{date}", dateLabel);
};
