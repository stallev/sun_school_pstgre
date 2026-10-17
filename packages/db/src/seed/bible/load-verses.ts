import { verseBatchSize } from "./constants";
import type { RstVerseRow, SeedTx } from "./types";

export type LoadVersesReport = { verseRows: number; batches: number };

function splitChunks<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Upserts RST verses for `translationId` (no `bible_chapter` table — chapter_number on each row).
 */
export async function loadVerses(
  tx: SeedTx,
  translationId: string,
  rows: readonly RstVerseRow[],
  bookIdBySortOrder: ReadonlyMap<number, string>,
): Promise<LoadVersesReport> {
  const batchSize = verseBatchSize();
  const chunks = splitChunks(rows, batchSize);
  let batchIndex = 0;

  for (const chunk of chunks) {
    batchIndex += 1;
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let param = 1;

    for (const row of chunk) {
      const bookId = bookIdBySortOrder.get(row.book_sort_order);
      if (!bookId) {
        throw new Error(`Missing bible_book for sort_order=${row.book_sort_order}`);
      }
      placeholders.push(
        `($${param}::uuid, $${param + 1}::uuid, $${param + 2}, $${param + 3}, $${param + 4}, $${param + 5})`,
      );
      values.push(
        translationId,
        bookId,
        row.chapter_number,
        row.verse_number,
        row.text,
        row.verse_order,
      );
      param += 6;
    }

    await tx.$executeRawUnsafe(
      `
      INSERT INTO bible_verse (translation_id, book_id, chapter_number, verse_number, text, verse_order)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (translation_id, book_id, chapter_number, verse_number)
      DO UPDATE SET text = EXCLUDED.text, verse_order = EXCLUDED.verse_order
      `,
      ...values,
    );
  }

  return { verseRows: rows.length, batches: batchIndex };
}
