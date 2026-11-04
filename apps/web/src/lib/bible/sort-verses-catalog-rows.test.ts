import { describe, expect, it } from "vitest";
import {
  compareVersesCatalogByBible,
  compareVersesCatalogByLessons,
  UNKNOWN_BIBLE_BOOK_SORT_ORDER,
} from "@/lib/bible/sort-verses-catalog-rows";

const row = (
  bookSortOrder: number,
  bookId: string,
  bookLabel: string,
  startChapter: number,
  startVerse: number,
  minLessonOrdinal: number | null,
) => ({
  bookSortOrder,
  bookId,
  bookLabel,
  startChapter,
  startVerse,
  minLessonOrdinal,
});

describe("compareVersesCatalogByBible (P26-CU9 Q-1)", () => {
  it("orders by canonical book sortOrder then chapter and verse", () => {
    const rows = [
      row(40, "mat", "Мф", 5, 3, 2),
      row(1, "gen", "Быт", 1, 1, 5),
      row(40, "mat", "Мф", 3, 16, 1),
    ].sort(compareVersesCatalogByBible);

    expect(rows.map((item) => `${item.bookLabel} ${item.startChapter}:${item.startVerse}`)).toEqual([
      "Быт 1:1",
      "Мф 3:16",
      "Мф 5:3",
    ]);
  });

  it("puts unknown books at the end alphabetically by label", () => {
    const unknownA = row(-1, "zzz", "Яз", 1, 1, null);
    const unknownB = row(-1, "aaa", "Апок", 1, 1, null);
    expect(compareVersesCatalogByBible(unknownA, unknownB)).toBeGreaterThan(0);
    expect(unknownA.bookSortOrder).toBeLessThan(0);
    expect(UNKNOWN_BIBLE_BOOK_SORT_ORDER).toBeGreaterThan(100);
  });
});

describe("compareVersesCatalogByLessons", () => {
  it("orders by earliest lesson ordinal", () => {
    const rows = [
      row(40, "mat", "Мф", 5, 3, 10),
      row(1, "gen", "Быт", 1, 1, 3),
      row(40, "mat", "Мф", 3, 16, 3),
    ].sort(compareVersesCatalogByLessons);

    expect(rows.map((item) => item.minLessonOrdinal)).toEqual([3, 3, 10]);
  });
});
