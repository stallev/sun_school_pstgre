import { accessSync } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  mapPsalmChapter,
  planVerseMapRows,
  resolveTranslationRefFromMap,
  type PlannedMapRow,
  type VersificationFile,
} from "./build-verse-map";
import { NIV_FILES } from "./paths";
import type { RstChapterRow, RstVerseRow } from "./types";

const PSALMS = 19;

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "../../../../..");

const rstChaptersAll: RstChapterRow[] = JSON.parse(
  readFileSync(path.join(repoRoot, "docs/my_specs/Bible/data/RelSQLData/bible_chapter_seed.json"), "utf8"),
);

function chapterMap(rows: readonly RstChapterRow[]) {
  return new Map(rows.map((row) => [`${row.book_sort_order}:${row.chapter_number}` as const, row]));
}

function syntheticVerses(chapters: readonly RstChapterRow[]): RstVerseRow[] {
  return chapters.flatMap((chapter) =>
    Array.from({ length: chapter.verses_count }, (_, i) => ({
      edition_code: chapter.edition_code,
      book_sort_order: chapter.book_sort_order,
      chapter_number: chapter.chapter_number,
      verse_number: i + 1,
      text: "",
      verse_order: 0,
    })),
  );
}

describe("resolveTranslationRefFromMap", () => {
  it("maps Пс. 22:1–3 (Synodal) to Ps. 23:1–3 in NIV (ADR-009 §7)", () => {
    const planned: PlannedMapRow[] = [1, 2, 3].map((verseNumber) => ({
      bookSortOrder: PSALMS,
      bookId: "psalms-id",
      chapterNumber: 23,
      verseNumber,
      commonChapter: 22,
      commonVerse: verseNumber,
    }));

    for (const commonVerse of [1, 2, 3]) {
      const ref = resolveTranslationRefFromMap(PSALMS, 22, commonVerse, planned);
      expect(ref).toEqual({ chapterNumber: 23, verseNumber: commonVerse });
    }
  });
});

describe("planVerseMapRows chapter by chapter", () => {
  const bookIdBySortOrder = new Map(Array.from({ length: 66 }, (_, i) => [i + 1, `book-${i + 1}`]));

  it("emits no rows for chapters whose verse counts are equal (Num 1, Mt 26, Jn 3)", () => {
    const equal = rstChaptersAll.filter(
      (c) =>
        (c.book_sort_order === 4 && c.chapter_number === 1) ||
        (c.book_sort_order === 40 && c.chapter_number === 26) ||
        (c.book_sort_order === 43 && c.chapter_number === 3),
    );
    expect(equal).toHaveLength(3);

    const { rows, incompleteChapters } = planVerseMapRows({
      nivVerses: syntheticVerses(equal),
      rstChapters: rstChaptersAll,
      nivChapters: equal,
      versification: { version: 1, exceptions: [] },
      bookIdBySortOrder,
    });

    expect(rows).toEqual([]);
    expect(incompleteChapters).toEqual([]);
  });

  it("flags a chapter with differing counts and no explicit rows instead of guessing a shift", () => {
    const rst = rstChaptersAll.find((c) => c.book_sort_order === 44 && c.chapter_number === 19)!;
    const niv = { ...rst, verses_count: rst.verses_count + 1 };

    const { incompleteChapters } = planVerseMapRows({
      nivVerses: syntheticVerses([niv]),
      rstChapters: rstChaptersAll,
      nivChapters: [niv],
      versification: { version: 1, exceptions: [] },
      bookIdBySortOrder,
    });

    expect(incompleteChapters).toEqual(["44:19"]);
  });
});

describe("versification.json hand-verified cases", () => {
  const versification = JSON.parse(
    readFileSync(path.join(moduleDir, "versification.json"), "utf8"),
  ) as VersificationFile;
  const find = (book: number, chapter: number, verse: number) =>
    versification.exceptions.find(
      (e) => e.bookSortOrder === book && e.chapterNumber === chapter && e.verseNumber === verse,
    );

  it("shifts psalm headings, merged verses and Lev. 14 / 2 Cor. 13 overflow", () => {
    expect(find(19, 13, 1)).toMatchObject({ commonChapter: 12, commonVerse: 2 });
    expect(find(19, 90, 6)).toMatchObject({ commonChapter: 89, commonVerse: 6 });
    expect(find(3, 14, 57)).toMatchObject({ commonChapter: 14, commonVerse: 56 });
    expect(find(47, 13, 14)).toMatchObject({ commonChapter: 13, commonVerse: 13 });
  });

  it("has no rows for chapters with equal counts (Num 1, Mt 26, Jn 3)", () => {
    for (const [book, chapter] of [[4, 1], [40, 26], [43, 3]] as const) {
      expect(versification.exceptions.some((e) => e.bookSortOrder === book && e.chapterNumber === chapter)).toBe(false);
    }
  });
});

describe("mapPsalmChapter", () => {
  const rst = chapterMap(rstChaptersAll);
  const nivCounts = (counts: Record<number, number>) =>
    chapterMap(Object.entries(counts).map(([chapter, verses_count]) => ({
      edition_code: "NIV",
      book_sort_order: PSALMS,
      chapter_number: Number(chapter),
      verses_count,
    })));

  it("shifts Hebrew numbering to Synodal and adds the superscription offset", () => {
    const niv = nivCounts({ 23: 6, 51: 19 });
    expect(mapPsalmChapter(23, rst, niv)?.get(1)).toEqual({ commonChapter: 22, commonVerse: 1 });
    expect(mapPsalmChapter(51, rst, niv)?.get(1)).toEqual({ commonChapter: 50, commonVerse: 3 });
  });

  it("joins Ps. 9–10 into Synodal Ps. 9 and splits Ps. 116 over Synodal 114–115", () => {
    const niv = nivCounts({ 9: 20, 10: 18, 116: 19 });
    expect(mapPsalmChapter(10, rst, niv)?.get(1)).toEqual({ commonChapter: 9, commonVerse: 22 });
    expect(mapPsalmChapter(116, rst, niv)?.get(10)).toEqual({ commonChapter: 115, commonVerse: 1 });
  });
});

const nivAvailable = (() => {
  try {
    accessSync(NIV_FILES.verses);
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!nivAvailable)("planVerseMapRows with local NIV seed", () => {
  it("produces a complete map plan", () => {
    const rstChapters = JSON.parse(
      readFileSync(path.join(repoRoot, "docs/my_specs/Bible/data/RelSQLData/bible_chapter_seed.json"), "utf8"),
    );
    const nivChapters = JSON.parse(readFileSync(NIV_FILES.chapters, "utf8"));
    const nivVerses = JSON.parse(readFileSync(NIV_FILES.verses, "utf8"));
    const versification = JSON.parse(
      readFileSync(path.join(moduleDir, "versification.json"), "utf8"),
    ) as VersificationFile;

    const bookIdBySortOrder = new Map(Array.from({ length: 66 }, (_, i) => [i + 1, `book-${i + 1}`]));
    const { incompleteChapters } = planVerseMapRows({
      nivVerses,
      rstChapters,
      nivChapters,
      versification,
      bookIdBySortOrder,
    });

    expect(incompleteChapters).toEqual([]);
  });
});
