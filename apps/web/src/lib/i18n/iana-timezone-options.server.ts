import "server-only";

import { formatIanaTimeZoneOptionLabel } from "@/lib/i18n/format-iana-timezone-option-label";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

/** Full IANA list for admin timezone picker (ADR-004 §4.8). */
export const listIanaTimeZoneOptions = (): string[] =>
  [...Intl.supportedValuesOf("timeZone")].sort((left, right) => left.localeCompare(right));

export type IanaTimeZoneOption = {
  value: string;
  label: string;
};

export const listIanaTimeZoneOptionLabels = (locale: MessageLocale): IanaTimeZoneOption[] =>
  listIanaTimeZoneOptions().map((value) => ({
    value,
    label: formatIanaTimeZoneOptionLabel(value, locale),
  }));
