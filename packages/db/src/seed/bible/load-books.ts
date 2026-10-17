import { BIBLE_BOOKS } from "../reference/bible-books";
import { BIBLE_EXPECTED } from "./constants";
import type { RstBookRow, SeedTx } from "./types";

export type LoadBooksReport = { upserted: number };

/**
 * Ensures 66 shared `bible_book` rows exist (Set A + RST seed). Reference seed owns metadata; this
 * step only creates missing rows from RST JSON merged with the English catalog (seed_data_spec §7.1).
 */
export async function loadBooks(tx: SeedTx, rows: readonly RstBookRow[]): Promise<LoadBooksReport> {
  if (rows.length !== BIBLE_EXPECTED.books) {
    throw new Error(`Expected ${BIBLE_EXPECTED.books} books in RST seed, got ${rows.length}`);
  }

  const catalogByOrder = new Map(BIBLE_BOOKS.map((book) => [book.sortOrder, book]));
  let upserted = 0;

  for (const row of rows) {
    const catalog = catalogByOrder.get(row.sort_order);
    if (!catalog) {
      throw new Error(`Unknown book sort_order=${row.sort_order} in RST seed`);
    }
    const existing = await tx.bibleBook.findUnique({ where: { sortOrder: row.sort_order } });
    if (existing) continue;

    const testament = row.testament === "OT" || row.testament === "NT" ? row.testament : catalog.testament;
    await tx.bibleBook.create({
      data: {
        sortOrder: row.sort_order,
        testament,
        titleRu: row.title,
        titleEn: catalog.titleEn,
        shortRu: row.short_title,
        shortEn: catalog.shortEn,
        chaptersCount: row.chapters_count,
      },
    });
    upserted += 1;
  }

  const total = await tx.bibleBook.count();
  if (total !== BIBLE_EXPECTED.books) {
    throw new Error(`bible_book count ${total} !== ${BIBLE_EXPECTED.books} after loadBooks`);
  }

  return { upserted };
}
