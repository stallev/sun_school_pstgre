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
  bricksBalance: (pupilId: string, yearId: string) => `bricks:balance:${pupilId}:${yearId}`,
  bricksLedger: (pupilId: string, yearId: string) => `bricks:ledger:${pupilId}:${yearId}`,
  analyticsGroup: (gradeId: string, yearId: string) => `analytics:group:${gradeId}:${yearId}`,
  analyticsPupil: (pupilId: string, yearId: string) => `analytics:pupil:${pupilId}:${yearId}`,
  analyticsSchool: (organizationId: string, yearId: string) =>
    `analytics:school:${organizationId}:${yearId}`,
  analyticsConducted: (gradeId: string, yearId: string) =>
    `analytics:conducted:${gradeId}:${yearId}`,
  analyticsDataQuality: (gradeId: string, yearId: string) =>
    `analytics:data-quality:${gradeId}:${yearId}`,
  analyticsDeletedData: (gradeId: string, yearId: string) =>
    `analytics:deleted-data:${gradeId}:${yearId}`,
  analyticsYears: (gradeId: string) => `analytics:years:${gradeId}`,
  analyticsPupilYears: (pupilId: string) => `analytics:pupil-years:${pupilId}`,
} as const;
