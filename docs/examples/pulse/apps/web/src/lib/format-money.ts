import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { formatMoney as formatMoneyI18n } from "@/lib/i18n/format";

export function formatMoney(
  amountCents: number,
  currency = "USD",
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatMoneyI18n(amountCents, currency, locale);
}
