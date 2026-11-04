import type { MessageLocale } from "@/lib/messages/dictionary-types";
import {
  getIanaTimeZoneLocaleLabels,
  hasIanaTimeZoneTranslation,
} from "@/lib/i18n/timezone-ru-labels";

export const formatUtcOffset = (timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  return raw.replace(/^GMT(?=$)/, "UTC").replace(/^GMT/, "UTC");
};

type FormatLabelOptions = {
  /** Saved zone outside translated catalog — show offset only (P27 N-path). */
  orphan?: boolean;
};

const buildPrimaryLabel = (
  timeZone: string,
  locale: MessageLocale,
  options?: FormatLabelOptions,
): string => {
  if (options?.orphan && !hasIanaTimeZoneTranslation(timeZone)) {
    return formatUtcOffset(timeZone);
  }

  const mapped = getIanaTimeZoneLocaleLabels(timeZone, locale);
  if (!mapped) {
    if (locale === "ru") {
      return formatUtcOffset(timeZone);
    }
    const fallbackCity = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
    const region = timeZone.split("/")[0]?.replace(/_/g, " ") ?? timeZone;
    const offset = formatUtcOffset(timeZone);
    return region ? `${fallbackCity}, ${region} (${offset})` : `${fallbackCity} (${offset})`;
  }

  const { city, region } = mapped;
  const offset = formatUtcOffset(timeZone);
  return region ? `${city}, ${region} (${offset})` : `${city} (${offset})`;
};

/** Human label for admin timezone picker (ADR-018 P25-T8, P26-T8, P27 D-2). */
export const formatIanaTimeZoneOptionLabel = (
  timeZone: string,
  locale: MessageLocale,
  options?: FormatLabelOptions,
): string => buildPrimaryLabel(timeZone, locale, options);

/** Disambiguate duplicate primary labels (same city + offset). */
export const disambiguateIanaTimeZoneOptionLabels = (
  options: readonly { value: string; label: string }[],
): { value: string; label: string }[] => {
  const counts = new Map<string, number>();
  for (const option of options) {
    counts.set(option.label, (counts.get(option.label) ?? 0) + 1);
  }
  return options.map((option) => {
    if ((counts.get(option.label) ?? 0) <= 1) return option;
    const suffix = option.value.split("/").pop()?.replace(/_/g, " ") ?? option.value;
    return { ...option, label: `${option.label} · ${suffix}` };
  });
};
