/** Golden-verse range in Synodal (common) numbering — homework_check_contract §4.1. */
export type VerseRangeInput = {
  bookId: string;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
};

export type CommonVerseRef = {
  bookId: string;
  chapter: number;
  verse: number;
};

/** One row of `bible_verse_map` (translation coordinates → common). */
export type VerseMapRow = {
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  commonChapter: number;
  commonVerse: number;
};
