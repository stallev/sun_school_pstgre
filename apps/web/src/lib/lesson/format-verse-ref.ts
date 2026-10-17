import { APP_LOCALE, type AppLocale, type VerseRangeInput } from "@sunschool/domain";

type BookShortTitles = { shortRu: string; shortEn: string };

export const formatVerseRefLabel = (
  book: BookShortTitles,
  locale: AppLocale,
  range: VerseRangeInput,
): string => {
  const short = locale === APP_LOCALE.EN ? book.shortEn : book.shortRu;
  const sameVerse =
    range.startChapter === range.endChapter && range.startVerse === range.endVerse;
  if (sameVerse) {
    return `${short} ${range.startChapter}:${range.startVerse}`;
  }
  if (range.startChapter === range.endChapter) {
    return `${short} ${range.startChapter}:${range.startVerse}–${range.endVerse}`;
  }
  return `${short} ${range.startChapter}:${range.startVerse}–${range.endChapter}:${range.endVerse}`;
};
