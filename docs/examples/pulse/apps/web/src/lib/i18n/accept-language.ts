import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/constants";

export function parseAcceptLanguage(header: string | null): AppLocale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const tags = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const quality = qPart ? Number.parseFloat(qPart) : 1;
      return { tag: tag.toLowerCase(), quality };
    })
    .sort((left, right) => right.quality - left.quality);

  for (const { tag } of tags) {
    if (tag.startsWith("ru") || tag.startsWith("uk") || tag.startsWith("be")) {
      return "ru";
    }
    if (tag.startsWith("en")) {
      return "en";
    }
  }

  return DEFAULT_LOCALE;
}
