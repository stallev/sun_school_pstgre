import type { MessageLocale } from "@/lib/messages/dictionary-types";

const CITY_LABELS: Partial<Record<string, { ru: string; en: string }>> = {
  "Europe/Moscow": { ru: "Москва", en: "Moscow" },
  "Europe/Kaliningrad": { ru: "Калининград", en: "Kaliningrad" },
  "Asia/Yekaterinburg": { ru: "Екатеринбург", en: "Yekaterinburg" },
  "Asia/Novosibirsk": { ru: "Новосибирск", en: "Novosibirsk" },
  "Asia/Vladivostok": { ru: "Владивосток", en: "Vladivostok" },
  "Europe/London": { ru: "Лондон", en: "London" },
  "America/New_York": { ru: "Нью-Йорк", en: "New York" },
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

/** Human label for admin timezone picker (ADR-018 P25-T8). */
export const formatIanaTimeZoneOptionLabel = (
  timeZone: string,
  locale: MessageLocale,
): string => {
  const mapped = CITY_LABELS[timeZone];
  const city = mapped ? (locale === "ru" ? mapped.ru : mapped.en) : fallbackCityLabel(timeZone);
  return `${city} (${formatUtcOffset(timeZone)})`;
};
