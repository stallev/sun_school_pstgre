import type { MessageLocale } from "@/lib/messages/dictionary-types";

type LocaleLabels = { city: string; region: string };

const TIMEZONE_LABELS: Partial<
  Record<string, { ru: LocaleLabels; en: LocaleLabels }>
> = {
  "Europe/Moscow": {
    ru: { city: "Москва", region: "Россия" },
    en: { city: "Moscow", region: "Russia" },
  },
  "Europe/Kyiv": {
    ru: { city: "Киев", region: "Украина" },
    en: { city: "Kyiv", region: "Ukraine" },
  },
  "Europe/Minsk": {
    ru: { city: "Минск", region: "Беларусь" },
    en: { city: "Minsk", region: "Belarus" },
  },
  "Asia/Almaty": {
    ru: { city: "Алматы", region: "Казахстан" },
    en: { city: "Almaty", region: "Kazakhstan" },
  },
  "Asia/Tashkent": {
    ru: { city: "Ташкент", region: "Узбекистан" },
    en: { city: "Tashkent", region: "Uzbekistan" },
  },
  "Asia/Tbilisi": {
    ru: { city: "Тбилиси", region: "Грузия" },
    en: { city: "Tbilisi", region: "Georgia" },
  },
  "Asia/Yerevan": {
    ru: { city: "Ереван", region: "Армения" },
    en: { city: "Yerevan", region: "Armenia" },
  },
  "Asia/Baku": {
    ru: { city: "Баку", region: "Азербайджан" },
    en: { city: "Baku", region: "Azerbaijan" },
  },
  "Europe/Kaliningrad": {
    ru: { city: "Калининград", region: "Россия" },
    en: { city: "Kaliningrad", region: "Russia" },
  },
  "Asia/Yekaterinburg": {
    ru: { city: "Екатеринбург", region: "Россия" },
    en: { city: "Yekaterinburg", region: "Russia" },
  },
  "Asia/Novosibirsk": {
    ru: { city: "Новосибирск", region: "Россия" },
    en: { city: "Novosibirsk", region: "Russia" },
  },
  "Asia/Vladivostok": {
    ru: { city: "Владивосток", region: "Россия" },
    en: { city: "Vladivostok", region: "Russia" },
  },
  "Europe/London": {
    ru: { city: "Лондон", region: "Великобритания" },
    en: { city: "London", region: "United Kingdom" },
  },
  "America/New_York": {
    ru: { city: "Нью-Йорк", region: "США" },
    en: { city: "New York", region: "United States" },
  },
};

const formatUtcOffset = (timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  return raw.replace(/^GMT(?=$)/, "UTC").replace(/^GMT/, "UTC");
};

const fallbackCityLabel = (timeZone: string): string =>
  timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;

const resolveLabels = (timeZone: string, locale: MessageLocale): LocaleLabels => {
  const mapped = TIMEZONE_LABELS[timeZone];
  if (mapped) return locale === "ru" ? mapped.ru : mapped.en;
  return { city: fallbackCityLabel(timeZone), region: timeZone.split("/")[0]?.replace(/_/g, " ") ?? timeZone };
};

const buildPrimaryLabel = (timeZone: string, locale: MessageLocale): string => {
  const { city, region } = resolveLabels(timeZone, locale);
  const offset = formatUtcOffset(timeZone);
  return region ? `${city}, ${region} (${offset})` : `${city} (${offset})`;
};

/** Human label for admin timezone picker (ADR-018 P25-T8, P26-T8). */
export const formatIanaTimeZoneOptionLabel = (
  timeZone: string,
  locale: MessageLocale,
): string => buildPrimaryLabel(timeZone, locale);

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
