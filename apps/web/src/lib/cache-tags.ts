/**
 * Cache tag registry — the single place for `cacheTag()` / `updateTag()` strings
 * (ai_loading_patterns.md §8). Tags are added together with the cached read that needs them.
 * Authorization and per-user data are never cached across requests.
 */
export const CACHE_TAGS = {
  UI_LOCALE: "ui-locale",
  SCHOOL_TIMEZONE: "school-timezone",
  BIBLE_BOOKS: "bible:books",
  bibleTranslation: (code: string) => `bible:translation:${code}`,
} as const;
