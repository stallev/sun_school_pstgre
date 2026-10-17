import type { VerseMapRow } from "./verse-range";

/** Synodal (common) coordinates → translation reference (bible_seed_contract §5.2, ADR-009 §7). */
export const resolveTranslationRef = (
  bookId: string,
  commonChapter: number,
  commonVerse: number,
  mapRows: readonly VerseMapRow[],
): { chapterNumber: number; verseNumber: number } => {
  for (const row of mapRows) {
    if (
      row.bookId === bookId &&
      row.commonChapter === commonChapter &&
      row.commonVerse === commonVerse
    ) {
      return { chapterNumber: row.chapterNumber, verseNumber: row.verseNumber };
    }
  }
  return { chapterNumber: commonChapter, verseNumber: commonVerse };
};
