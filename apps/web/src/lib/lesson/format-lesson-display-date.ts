import type { AppLocale } from "@sunschool/domain";

import { formatDateTime } from "@/lib/i18n/format";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

type FormatLessonDisplayDateOptions = {
  locale: MessageLocale | AppLocale;
  timeZone: string;
  weekday?: "short" | "long";
};

/** Calendar lesson date (YYYY-MM-DD) for product UI — not ISO raw. */
export const formatLessonDisplayDate = (
  lessonDateIso: string,
  { locale, timeZone, weekday }: FormatLessonDisplayDateOptions,
): string =>
  formatDateTime(`${lessonDateIso}T12:00:00.000Z`, {
    locale,
    timeZone,
    weekday,
    day: "numeric",
    month: "long",
  });
