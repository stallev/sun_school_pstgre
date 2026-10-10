import type { TrainerServiceItem } from "@/lib/trainer/trainer-profile";
import { type AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";

export function formatBookingPrice(
  cents: number,
  currency: string,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatMoney(cents, currency, locale);
}

export function formatBookingDateTime(
  startsAtUtc: string,
  timezone: string,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatDateTime(startsAtUtc, {
    locale,
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function findSelectedService(
  services: TrainerServiceItem[],
  serviceId: string | null,
): TrainerServiceItem | null {
  if (!serviceId) {
    return services[0] ?? null;
  }

  return services.find((service) => service.id === serviceId) ?? services[0] ?? null;
}

export const BOOKING_WIZARD_TOTAL_STEPS = 3;

export const BOOKING_WIZARD_STEP = {
  service: 1,
  slot: 2,
  confirm: 3,
} as const;

/** Calendar days shown in the booking wizard slot step (today + next 6). */
export const BOOKING_WIZARD_SLOT_DAY_COUNT = 7;
