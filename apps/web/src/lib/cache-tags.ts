/**
 * Cache tag registry — the single place for `cacheTag()` / `updateTag()` strings
 * (ai_loading_patterns.md §8). Tags are added together with the cached read that needs them.
 * Authorization and per-user data are never cached across requests.
 */
export const CACHE_TAGS = {
  // e.g. BIBLE_TRANSLATION: (code: string) => `bible:translation:${code}` — added in P03-CU5
} as const;
