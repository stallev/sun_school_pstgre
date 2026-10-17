import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RstChapterRow, RstVerseRow, SeedTx } from "./types";

const PSALMS_SORT_ORDER = 19;

export type VersificationEntry = {
  bookSortOrder: number;
  chapterNumber: number;
  verseNumber: number;
  commonChapter: number;
  commonVerse: number;
};

export type VersificationFile = {
  version: 1;
  /** Explicit verse mappings for non-Psalm chapters whose verse counts differ (psalms are computed, except heading overrides). */
  exceptions: VersificationEntry[];
};

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const VERSIFICATION_PATH = path.join(moduleDir, "versification.json");

export async function loadVersification(): Promise<VersificationFile> {
  const raw = await readFile(VERSIFICATION_PATH, "utf8");
  const parsed = JSON.parse(raw) as VersificationFile;
  if (parsed.version !== 1 || !Array.isArray(parsed.exceptions)) {
    throw new Error("Invalid versification.json shape");
  }
  return parsed;
}

type ChapterKey = `${number}:${number}`;

function chapterKey(bookSortOrder: number, chapterNumber: number): ChapterKey {
  return `${bookSortOrder}:${chapterNumber}`;
}

function indexChapters(rows: readonly RstChapterRow[]): Map<ChapterKey, RstChapterRow> {
  const map = new Map<ChapterKey, RstChapterRow>();
  for (const row of rows) {
    map.set(chapterKey(row.book_sort_order, row.chapter_number), row);
  }
  return map;
}

function indexVersesByChapter(rows: readonly RstVerseRow[]): Map<ChapterKey, RstVerseRow[]> {
  const map = new Map<ChapterKey, RstVerseRow[]>();
  for (const row of rows) {
    const key = chapterKey(row.book_sort_order, row.chapter_number);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.verse_number - b.verse_number);
  }
  return map;
}

type CommonRef = { commonChapter: number; commonVerse: number };

/**
 * Psalm chapter groups (bible_seed_contract §6): Synodal follows the Septuagint numbering, NIV the Hebrew one.
 * Each group pairs consecutive NIV chapters with the Synodal chapters that carry the same text.
 */
export function psalmChapterGroup(nivChapter: number): { niv: number[]; rst: number[] } {
  if (nivChapter <= 8 || nivChapter >= 148) return { niv: [nivChapter], rst: [nivChapter] };
  if (nivChapter === 9 || nivChapter === 10) return { niv: [9, 10], rst: [9] };
  if (nivChapter === 114 || nivChapter === 115) return { niv: [114, 115], rst: [113] };
  if (nivChapter === 116) return { niv: [116], rst: [114, 115] };
  if (nivChapter === 147) return { niv: [147], rst: [146, 147] };
  return { niv: [nivChapter], rst: [nivChapter - 1] };
}

/**
 * Maps every verse of one NIV psalm chapter to Synodal coordinates by position inside its group:
 * the verse streams are concatenated and Synodal numbering is shifted by the superscription verses
 * (`rstTotal − nivTotal`, counted as verses only in Synodal). Returns null when counts do not fit.
 */
export function mapPsalmChapter(
  nivChapter: number,
  rstChapters: ReadonlyMap<ChapterKey, RstChapterRow>,
  nivChapters: ReadonlyMap<ChapterKey, RstChapterRow>,
): Map<number, CommonRef> | null {
  const group = psalmChapterGroup(nivChapter);
  const nivCounts = group.niv.map((c) => nivChapters.get(chapterKey(PSALMS_SORT_ORDER, c))?.verses_count);
  const rstCounts = group.rst.map((c) => rstChapters.get(chapterKey(PSALMS_SORT_ORDER, c))?.verses_count);
  if (nivCounts.some((n) => n === undefined) || rstCounts.some((n) => n === undefined)) return null;

  const nivTotal = (nivCounts as number[]).reduce((sum, n) => sum + n, 0);
  const rstTotal = (rstCounts as number[]).reduce((sum, n) => sum + n, 0);
  const offset = rstTotal - nivTotal;
  if (offset < 0) return null;

  const nivStart = (nivCounts as number[])
    .slice(0, group.niv.indexOf(nivChapter))
    .reduce((sum, n) => sum + n, 0);
  const ownCount = nivCounts[group.niv.indexOf(nivChapter)] as number;

  const result = new Map<number, CommonRef>();
  for (let verse = 1; verse <= ownCount; verse += 1) {
    let position = nivStart + verse + offset;
    let index = 0;
    while (position > (rstCounts[index] as number)) {
      position -= rstCounts[index] as number;
      index += 1;
    }
    result.set(verse, { commonChapter: group.rst[index] as number, commonVerse: position });
  }
  return result;
}

export type PlannedMapRow = VersificationEntry & {
  bookId: string;
};

/**
 * Builds all exception rows for NIV (translation side → Synodal common).
 * RST uses identity and produces no rows.
 */
export function planVerseMapRows(input: {
  nivVerses: readonly RstVerseRow[];
  rstChapters: readonly RstChapterRow[];
  nivChapters: readonly RstChapterRow[];
  versification: VersificationFile;
  bookIdBySortOrder: ReadonlyMap<number, string>;
}): { rows: PlannedMapRow[]; incompleteChapters: ChapterKey[] } {
  const { nivVerses, rstChapters, nivChapters, versification, bookIdBySortOrder } = input;

  const rstChapterByKey = indexChapters(rstChapters);
  const nivChapterByKey = indexChapters(nivChapters);
  const nivVersesByChapter = indexVersesByChapter(nivVerses);

  const explicitByKey = new Map<string, VersificationEntry>();
  for (const entry of versification.exceptions) {
    explicitByKey.set(
      `${entry.bookSortOrder}:${entry.chapterNumber}:${entry.verseNumber}`,
      entry,
    );
  }

  const rows: PlannedMapRow[] = [];
  const incompleteChapters = new Set<ChapterKey>();

  for (const [key, verses] of nivVersesByChapter) {
    const [bookStr, chapterStr] = key.split(":");
    const bookSortOrder = Number(bookStr);
    const chapterNumber = Number(chapterStr);
    const bookId = bookIdBySortOrder.get(bookSortOrder);
    if (!bookId) {
      throw new Error(`Missing bible_book for sort_order=${bookSortOrder}`);
    }

    const nivChapter = nivChapterByKey.get(key);
    const psalmCache = new Map<number, Map<number, CommonRef> | null>();
    const psalmByChapter = (chapter: number) => {
      if (!psalmCache.has(chapter)) {
        psalmCache.set(chapter, mapPsalmChapter(chapter, rstChapterByKey, nivChapterByKey));
      }
      return psalmCache.get(chapter) ?? null;
    };

    for (const verse of verses) {
      const explicit = explicitByKey.get(`${bookSortOrder}:${chapterNumber}:${verse.verse_number}`);
      if (explicit) {
        if (
          explicit.commonChapter !== chapterNumber ||
          explicit.commonVerse !== verse.verse_number
        ) {
          rows.push({ ...explicit, bookId });
        }
        continue;
      }

      let mapped: CommonRef | null = null;
      if (bookSortOrder === PSALMS_SORT_ORDER) {
        mapped = psalmByChapter(chapterNumber)?.get(verse.verse_number) ?? null;
      } else {
        const rstChapter = rstChapterByKey.get(key);
        if (!nivChapter || !rstChapter) {
          incompleteChapters.add(key);
          continue;
        }
        // Chapters with equal verse counts are identity; differing counts need explicit rows
        // (generate-versification.mjs) — never guess a shift.
        if (nivChapter.verses_count === rstChapter.verses_count) {
          mapped = { commonChapter: chapterNumber, commonVerse: verse.verse_number };
        }
      }

      if (!mapped) {
        incompleteChapters.add(key);
        continue;
      }
      if (mapped.commonChapter !== chapterNumber || mapped.commonVerse !== verse.verse_number) {
        rows.push({
          bookSortOrder,
          chapterNumber,
          verseNumber: verse.verse_number,
          commonChapter: mapped.commonChapter,
          commonVerse: mapped.commonVerse,
          bookId,
        });
      }
    }
  }

  return { rows, incompleteChapters: [...incompleteChapters] };
}

export type BuildVerseMapReport = {
  upserted: number;
  incompleteChapters: ChapterKey[];
};

/** Upserts `bible_verse_map` exception rows for a non-RST translation (bible_seed_contract §6). */
export async function buildVerseMap(
  tx: SeedTx,
  translationId: string,
  planned: readonly PlannedMapRow[],
): Promise<BuildVerseMapReport> {
  await tx.bibleVerseMap.deleteMany({ where: { translationId } });

  const batchSize = 500;
  let upserted = 0;
  for (let i = 0; i < planned.length; i += batchSize) {
    const chunk = planned.slice(i, i + batchSize);
    await tx.bibleVerseMap.createMany({
      data: chunk.map((row) => ({
        translationId,
        bookId: row.bookId,
        chapterNumber: row.chapterNumber,
        verseNumber: row.verseNumber,
        commonChapter: row.commonChapter,
        commonVerse: row.commonVerse,
      })),
    });
    upserted += chunk.length;
  }

  return { upserted, incompleteChapters: [] };
}

/** §7: each mapped chapter must account for every translation verse via map or identity. */
export async function verifyVerseMapForTranslation(
  tx: SeedTx,
  translationId: string,
  nivChapters: readonly RstChapterRow[],
  incompleteChapters: readonly ChapterKey[],
): Promise<void> {
  if (incompleteChapters.length > 0) {
    throw new Error(
      `bible_verse_map incomplete for chapters: ${incompleteChapters.slice(0, 8).join(", ")}`,
    );
  }

  const mapRows = await tx.bibleVerseMap.findMany({
    where: { translationId },
    select: { bookId: true, chapterNumber: true, verseNumber: true, commonChapter: true, commonVerse: true },
  });

  const books = await tx.bibleBook.findMany({ select: { id: true, sortOrder: true } });
  const sortByBookId = new Map(books.map((book) => [book.id, book.sortOrder]));

  const mappedVersesByChapter = new Map<ChapterKey, number>();
  for (const row of mapRows) {
    const sortOrder = sortByBookId.get(row.bookId);
    if (sortOrder === undefined) continue;
    const key = chapterKey(sortOrder, row.chapterNumber);
    mappedVersesByChapter.set(key, (mappedVersesByChapter.get(key) ?? 0) + 1);
  }

  for (const chapter of nivChapters) {
    const key = chapterKey(chapter.book_sort_order, chapter.chapter_number);
    const mapped = mappedVersesByChapter.get(key) ?? 0;
    const identityVerses = chapter.verses_count - mapped;
    if (identityVerses < 0) {
      throw new Error(`Verse map over-counts chapter ${key}`);
    }
  }
}

/** Resolve Synodal (common) coordinates → NIV reference (ADR-009 §7). */
export function resolveTranslationRefFromMap(
  bookSortOrder: number,
  commonChapter: number,
  commonVerse: number,
  planned: readonly PlannedMapRow[],
): { chapterNumber: number; verseNumber: number } {
  for (const row of planned) {
    if (
      row.bookSortOrder === bookSortOrder &&
      row.commonChapter === commonChapter &&
      row.commonVerse === commonVerse
    ) {
      return { chapterNumber: row.chapterNumber, verseNumber: row.verseNumber };
    }
  }
  return { chapterNumber: commonChapter, verseNumber: commonVerse };
}
