import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { BIBLE_EXPECTED } from "./constants";
import type { RstChapterRow, SeedTx } from "./types";

export class BibleVerifyError extends Error {
  readonly code = MUTATION_ERROR_CODES.BIBLE_VERIFY_FAILED;

  constructor(message: string) {
    super(message);
    this.name = "BibleVerifyError";
  }
}

export type VerifyReport = {
  books: number;
  chapters: number;
  verses: number;
};

/** bible_seed_contract §7; RST skips empty `bible_verse_map`. */
export async function verifyTranslation(
  tx: SeedTx,
  translationId: string,
  chapterRows: readonly RstChapterRow[],
): Promise<VerifyReport> {
  const books = await tx.bibleBook.count();
  if (books !== BIBLE_EXPECTED.books) {
    throw new BibleVerifyError(`Book count ${books} !== ${BIBLE_EXPECTED.books}`);
  }

  const chapterGroups = await tx.bibleVerse.groupBy({
    by: ["bookId", "chapterNumber"],
    where: { translationId },
    _count: { _all: true },
  });
  const chapters = chapterGroups.length;
  if (chapters !== BIBLE_EXPECTED.chapters) {
    throw new BibleVerifyError(`Chapter count ${chapters} !== ${BIBLE_EXPECTED.chapters}`);
  }

  const verses = await tx.bibleVerse.count({ where: { translationId } });
  if (verses !== BIBLE_EXPECTED.versesRst) {
    throw new BibleVerifyError(`Verse count ${verses} !== ${BIBLE_EXPECTED.versesRst}`);
  }

  const booksBySort = await tx.bibleBook.findMany({ select: { id: true, sortOrder: true } });
  const sortByBookId = new Map(booksBySort.map((book) => [book.id, book.sortOrder]));

  const versesByChapterKey = new Map<string, number>();
  for (const group of chapterGroups) {
    const sortOrder = sortByBookId.get(group.bookId);
    if (sortOrder === undefined) continue;
    versesByChapterKey.set(`${sortOrder}:${group.chapterNumber}`, group._count._all);
  }

  for (const chapter of chapterRows) {
    const key = `${chapter.book_sort_order}:${chapter.chapter_number}`;
    const actual = versesByChapterKey.get(key) ?? 0;
    if (actual !== chapter.verses_count) {
      throw new BibleVerifyError(
        `Chapter ${key} verse count ${actual} !== expected ${chapter.verses_count}`,
      );
    }
  }

  const duplicateOrders = await tx.$queryRaw<Array<{ verse_order: number; c: bigint }>>`
    SELECT verse_order, COUNT(*)::bigint AS c
    FROM bible_verse
    WHERE translation_id = ${translationId}::uuid
    GROUP BY verse_order
    HAVING COUNT(*) > 1
  `;
  if (duplicateOrders.length > 0) {
    throw new BibleVerifyError(`Duplicate verse_order values: ${duplicateOrders.length} groups`);
  }

  return { books, chapters, verses };
}
