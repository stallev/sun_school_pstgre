import { formatRelative } from "@/lib/i18n/format";
import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";

export function formatAdminRelativeDate(
  iso: string,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatRelative(iso, locale);
}
