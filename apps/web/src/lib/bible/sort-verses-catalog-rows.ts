export type VersesCatalogSortRow = {
  bookSortOrder: number;
  bookId: string;
  bookLabel: string;
  startChapter: number;
  startVerse: number;
  minLessonOrdinal: number | null;
};

export const UNKNOWN_BIBLE_BOOK_SORT_ORDER = 9_999;

export const compareVersesCatalogByBible = (
  left: VersesCatalogSortRow,
  right: VersesCatalogSortRow,
): number => {
  const leftOrder = left.bookSortOrder >= 0 ? left.bookSortOrder : UNKNOWN_BIBLE_BOOK_SORT_ORDER;
  const rightOrder = right.bookSortOrder >= 0 ? right.bookSortOrder : UNKNOWN_BIBLE_BOOK_SORT_ORDER;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  if (leftOrder === UNKNOWN_BIBLE_BOOK_SORT_ORDER && rightOrder === UNKNOWN_BIBLE_BOOK_SORT_ORDER) {
    const byLabel = left.bookLabel.localeCompare(right.bookLabel, "ru");
    if (byLabel !== 0) return byLabel;
  }
  if (left.startChapter !== right.startChapter) return left.startChapter - right.startChapter;
  if (left.startVerse !== right.startVerse) return left.startVerse - right.startVerse;
  return left.bookId.localeCompare(right.bookId);
};

export const compareVersesCatalogByLessons = (
  left: VersesCatalogSortRow,
  right: VersesCatalogSortRow,
): number => {
  const leftOrdinal = left.minLessonOrdinal ?? Number.MAX_SAFE_INTEGER;
  const rightOrdinal = right.minLessonOrdinal ?? Number.MAX_SAFE_INTEGER;
  if (leftOrdinal !== rightOrdinal) return leftOrdinal - rightOrdinal;
  return compareVersesCatalogByBible(left, right);
};
