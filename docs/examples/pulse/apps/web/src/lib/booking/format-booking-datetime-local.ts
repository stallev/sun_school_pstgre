import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { formatDateTime } from "@/lib/i18n/format";

export function formatBookingDateTimeLocal(
  startsAtUtc: string,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatDateTime(startsAtUtc, {
    locale,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
