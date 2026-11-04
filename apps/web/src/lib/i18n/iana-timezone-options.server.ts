import "server-only";

import {
  disambiguateIanaTimeZoneOptionLabels,
  formatIanaTimeZoneOptionLabel,
} from "@/lib/i18n/format-iana-timezone-option-label";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

/** Popular school time zones first (P26-T8), then alphabetical by label. */
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

/** Full IANA list for admin timezone picker (ADR-004 §4.8). */
export const listIanaTimeZoneOptions = (): string[] =>
  [...Intl.supportedValuesOf("timeZone")].sort((left, right) => left.localeCompare(right));

export type IanaTimeZoneOption = {
  value: string;
  label: string;
};

export const listIanaTimeZoneOptionLabels = (locale: MessageLocale): IanaTimeZoneOption[] => {
  const allValues = listIanaTimeZoneOptions();
  const byValue = new Map(
    allValues.map((value) => [value, formatIanaTimeZoneOptionLabel(value, locale)] as const),
  );
  const popularSet = new Set<string>(POPULAR_IANA_TIME_ZONES);
  const popular: IanaTimeZoneOption[] = POPULAR_IANA_TIME_ZONES.filter((value) =>
    byValue.has(value),
  ).map((value) => ({ value, label: byValue.get(value)! }));

  const rest = allValues
    .filter((value) => !popularSet.has(value))
    .map((value) => ({ value, label: byValue.get(value)! }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));

  return disambiguateIanaTimeZoneOptionLabels([...popular, ...rest]);
};
