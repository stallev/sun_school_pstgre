import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { formatMoney } from "@/lib/i18n/format";

export function formatServicePrice(
  cents: number,
  currency: string,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatMoney(cents, currency, locale);
}
