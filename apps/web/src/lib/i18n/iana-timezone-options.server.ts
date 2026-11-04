import "server-only";

import {
  disambiguateIanaTimeZoneOptionLabels,
  formatIanaTimeZoneOptionLabel,
} from "@/lib/i18n/format-iana-timezone-option-label";
import {
  hasIanaTimeZoneTranslation,
  TRANSLATED_IANA_TIME_ZONE_IDS,
} from "@/lib/i18n/timezone-ru-labels";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

/** Popular school time zones first (P26-T8), then by UTC offset. */
export const POPULAR_IANA_TIME_ZONES = [
  "Europe/Moscow",
  "Europe/Kyiv",
  "Europe/Minsk",
  "Asia/Almaty",
  "Asia/Tashkent",
  "Asia/Tbilisi",
  "Asia/Yerevan",
  "Asia/Baku",
] as const;

export type IanaTimeZoneOption = {
  value: string;
  label: string;
};

export const getUtcOffsetMinutes = (timeZone: string, at = new Date()): number => {
  const part =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(at)
      .find((entry) => entry.type === "timeZoneName")?.value ?? "GMT";
  const match = part.match(/GMT(?:(\+|-)(\d{1,2}))?(?::(\d{2}))?/);
  if (!match || !match[1]) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
};

type ListOptions = {
  /** Keep current DB value selectable even when not in translated catalog. */
  ensureIncluded?: string;
};

export const listIanaTimeZoneOptionLabels = (
  locale: MessageLocale,
  listOptions?: ListOptions,
): IanaTimeZoneOption[] => {
  const popularSet = new Set<string>(POPULAR_IANA_TIME_ZONES);
  const build = (value: string, orphan = false): IanaTimeZoneOption => ({
    value,
    label: formatIanaTimeZoneOptionLabel(value, locale, orphan ? { orphan: true } : undefined),
  });

  const popular: IanaTimeZoneOption[] = POPULAR_IANA_TIME_ZONES.filter((value) =>
    hasIanaTimeZoneTranslation(value),
  ).map((value) => build(value));

  const restIds = TRANSLATED_IANA_TIME_ZONE_IDS.filter((value) => !popularSet.has(value)).sort(
    (left, right) => {
      const offsetDiff = getUtcOffsetMinutes(left) - getUtcOffsetMinutes(right);
      if (offsetDiff !== 0) return offsetDiff;
      return formatIanaTimeZoneOptionLabel(left, locale).localeCompare(
        formatIanaTimeZoneOptionLabel(right, locale),
        locale,
      );
    },
  );
  const rest = restIds.map((value) => build(value));

  let options = disambiguateIanaTimeZoneOptionLabels([...popular, ...rest]);

  const ensure = listOptions?.ensureIncluded;
  if (ensure && !options.some((option) => option.value === ensure)) {
    options = [...options, build(ensure, true)];
  }

  return options;
};
