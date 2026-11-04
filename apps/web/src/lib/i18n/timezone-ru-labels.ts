import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type TimeZoneLocaleLabels = { city: string; region: string };

/** ≈40 IANA zones with city + region labels (P27 D-2, ADR-020 §8). */
export const IANA_TIME_ZONE_TRANSLATIONS: Record<
  string,
  { ru: TimeZoneLocaleLabels; en: TimeZoneLocaleLabels }
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
  "Europe/Samara": {
    ru: { city: "Самара", region: "Россия" },
    en: { city: "Samara", region: "Russia" },
  },
  "Europe/Volgograd": {
    ru: { city: "Волгоград", region: "Россия" },
    en: { city: "Volgograd", region: "Russia" },
  },
  "Asia/Yekaterinburg": {
    ru: { city: "Екатеринбург", region: "Россия" },
    en: { city: "Yekaterinburg", region: "Russia" },
  },
  "Asia/Omsk": {
    ru: { city: "Омск", region: "Россия" },
    en: { city: "Omsk", region: "Russia" },
  },
  "Asia/Novosibirsk": {
    ru: { city: "Новосибирск", region: "Россия" },
    en: { city: "Novosibirsk", region: "Russia" },
  },
  "Asia/Krasnoyarsk": {
    ru: { city: "Красноярск", region: "Россия" },
    en: { city: "Krasnoyarsk", region: "Russia" },
  },
  "Asia/Irkutsk": {
    ru: { city: "Иркутск", region: "Россия" },
    en: { city: "Irkutsk", region: "Russia" },
  },
  "Asia/Yakutsk": {
    ru: { city: "Якутск", region: "Россия" },
    en: { city: "Yakutsk", region: "Russia" },
  },
  "Asia/Vladivostok": {
    ru: { city: "Владивосток", region: "Россия" },
    en: { city: "Vladivostok", region: "Russia" },
  },
  "Asia/Magadan": {
    ru: { city: "Магадан", region: "Россия" },
    en: { city: "Magadan", region: "Russia" },
  },
  "Asia/Kamchatka": {
    ru: { city: "Петропавловск-Камчатский", region: "Россия" },
    en: { city: "Petropavlovsk-Kamchatsky", region: "Russia" },
  },
  "Asia/Tomsk": {
    ru: { city: "Томск", region: "Россия" },
    en: { city: "Tomsk", region: "Russia" },
  },
  "Europe/London": {
    ru: { city: "Лондон", region: "Великобритания" },
    en: { city: "London", region: "United Kingdom" },
  },
  "Europe/Berlin": {
    ru: { city: "Берлин", region: "Германия" },
    en: { city: "Berlin", region: "Germany" },
  },
  "Europe/Paris": {
    ru: { city: "Париж", region: "Франция" },
    en: { city: "Paris", region: "France" },
  },
  "Europe/Warsaw": {
    ru: { city: "Варшава", region: "Польша" },
    en: { city: "Warsaw", region: "Poland" },
  },
  "Europe/Helsinki": {
    ru: { city: "Хельсинки", region: "Финляндия" },
    en: { city: "Helsinki", region: "Finland" },
  },
  "Europe/Riga": {
    ru: { city: "Рига", region: "Латвия" },
    en: { city: "Riga", region: "Latvia" },
  },
  "Europe/Vilnius": {
    ru: { city: "Вильнюс", region: "Литва" },
    en: { city: "Vilnius", region: "Lithuania" },
  },
  "Europe/Chisinau": {
    ru: { city: "Кишинёв", region: "Молдова" },
    en: { city: "Chisinau", region: "Moldova" },
  },
  "Europe/Istanbul": {
    ru: { city: "Стамбул", region: "Турция" },
    en: { city: "Istanbul", region: "Turkey" },
  },
  "Asia/Dubai": {
    ru: { city: "Дубай", region: "ОАЭ" },
    en: { city: "Dubai", region: "United Arab Emirates" },
  },
  "Asia/Qatar": {
    ru: { city: "Доха", region: "Катар" },
    en: { city: "Doha", region: "Qatar" },
  },
  "Asia/Seoul": {
    ru: { city: "Сеул", region: "Корея" },
    en: { city: "Seoul", region: "South Korea" },
  },
  "Asia/Tokyo": {
    ru: { city: "Токио", region: "Япония" },
    en: { city: "Tokyo", region: "Japan" },
  },
  "America/New_York": {
    ru: { city: "Нью-Йорк", region: "США" },
    en: { city: "New York", region: "United States" },
  },
  "America/Chicago": {
    ru: { city: "Чикаго", region: "США" },
    en: { city: "Chicago", region: "United States" },
  },
  "America/Los_Angeles": {
    ru: { city: "Лос-Анджелес", region: "США" },
    en: { city: "Los Angeles", region: "United States" },
  },
  "Africa/Cairo": {
    ru: { city: "Каир", region: "Египет" },
    en: { city: "Cairo", region: "Egypt" },
  },
  "Australia/Sydney": {
    ru: { city: "Сидней", region: "Австралия" },
    en: { city: "Sydney", region: "Australia" },
  },
  "Pacific/Auckland": {
    ru: { city: "Окленд", region: "Новая Зеландия" },
    en: { city: "Auckland", region: "New Zealand" },
  },
};

export const TRANSLATED_IANA_TIME_ZONE_IDS = Object.keys(IANA_TIME_ZONE_TRANSLATIONS);

export const hasIanaTimeZoneTranslation = (timeZone: string): boolean =>
  timeZone in IANA_TIME_ZONE_TRANSLATIONS;

export const getIanaTimeZoneLocaleLabels = (
  timeZone: string,
  locale: MessageLocale,
): TimeZoneLocaleLabels | null => {
  const mapped = IANA_TIME_ZONE_TRANSLATIONS[timeZone];
  if (!mapped) return null;
  return locale === "ru" ? mapped.ru : mapped.en;
};

export const labelContainsUnexpectedLatin = (label: string): boolean => {
  const withoutUtc = label.replace(/UTC/g, "");
  return /[A-Za-z]/.test(withoutUtc);
};
