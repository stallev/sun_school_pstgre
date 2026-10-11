/**
 * NIV-only bible seed (Variant A): upserts from docs/data/RelSQLData/niv/.
 * Loads DATABASE_URL from apps/web/.env.local when not set in shell.
 *
 * Idempotent upserts; does not TRUNCATE. Safe alongside RST edition in the same DB.
 * See docs/data/RelSQLData/niv/README.md and bible_domain_mapping.md.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mergeAppsWebLocalEnv } from "./load-apps-web-local-env.mjs";

let Client;
try {
  ({ Client } = await import("pg"));
} catch {
  console.error("Не найден пакет 'pg'. Установите его: npm install pg");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

mergeAppsWebLocalEnv(repoRoot);

const nivDataDir = path.join(repoRoot, "docs", "data", "RelSQLData", "niv");

const EDITIONS_FILE = path.join(nivDataDir, "bible_edition_seed.json");
const BOOKS_FILE = path.join(nivDataDir, "bible_book_seed.json");
const CHAPTERS_FILE = path.join(nivDataDir, "bible_chapter_seed.json");
const VERSES_FILE = path.join(nivDataDir, "bible_verse_seed.json");

const VERSE_BATCH_SIZE = Number(process.env.BIBLE_SEED_VERSE_BATCH_SIZE ?? 1000);

function splitIntoChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL не задана. Укажите в apps/web/.env.local или в окружении shell.",
    );
  }

  const editions = await loadJson(EDITIONS_FILE);
  const books = await loadJson(BOOKS_FILE);
  const chapters = await loadJson(CHAPTERS_FILE);
  const verses = await loadJson(VERSES_FILE);

  if (editions.length !== 1) {
    throw new Error(
      `NIV pack: ожидалась 1 запись издания в JSON, получено: ${editions.length}`,
    );
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");

    const edition = editions[0];
    const editionRes = await client.query(
      `
      INSERT INTO bible_edition (locale_code, name, short_name, is_default)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (locale_code, name)
      DO UPDATE
        SET short_name = EXCLUDED.short_name,
            is_default = EXCLUDED.is_default
      RETURNING id
      `,
      [edition.locale_code, edition.name, edition.short_name, edition.is_default],
    );
    const editionId = editionRes.rows[0].id;

    const bookIdBySortOrder = new Map();
    for (const book of books) {
      const res = await client.query(
        `
        INSERT INTO bible_book (edition_id, title, short_title, testament, sort_order, chapters_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (edition_id, sort_order)
        DO UPDATE
          SET title = EXCLUDED.title,
              short_title = EXCLUDED.short_title,
              testament = EXCLUDED.testament,
              chapters_count = EXCLUDED.chapters_count
        RETURNING id
        `,
        [
          editionId,
          book.title,
          book.short_title,
          book.testament,
          book.sort_order,
          book.chapters_count,
        ],
      );
      bookIdBySortOrder.set(book.sort_order, res.rows[0].id);
    }

    const chapterIdByNaturalKey = new Map();
    for (const chapter of chapters) {
      const bookId = bookIdBySortOrder.get(chapter.book_sort_order);
      if (!bookId) {
        throw new Error(`Не найден book_id для sort_order=${chapter.book_sort_order}`);
      }

      const res = await client.query(
        `
        INSERT INTO bible_chapter (book_id, chapter_number, verses_count)
        VALUES ($1, $2, $3)
        ON CONFLICT (book_id, chapter_number)
        DO UPDATE
          SET verses_count = EXCLUDED.verses_count
        RETURNING id
        `,
        [bookId, chapter.chapter_number, chapter.verses_count],
      );
      const key = `${chapter.book_sort_order}:${chapter.chapter_number}`;
      chapterIdByNaturalKey.set(key, res.rows[0].id);
    }

    const chunks = splitIntoChunks(verses, VERSE_BATCH_SIZE);
    for (const chunk of chunks) {
      const values = [];
      const placeholders = [];
      let i = 1;

      for (const verse of chunk) {
        const chapterKey = `${verse.book_sort_order}:${verse.chapter_number}`;
        const chapterId = chapterIdByNaturalKey.get(chapterKey);
        if (!chapterId) {
          throw new Error(`Не найден chapter_id для ключа=${chapterKey}`);
        }

        placeholders.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`);
        values.push(chapterId, verse.verse_number, verse.text, verse.verse_order);
        i += 4;
      }

      await client.query(
        `
        INSERT INTO bible_verse (chapter_id, verse_number, text, verse_order)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (chapter_id, verse_number)
        DO UPDATE
          SET text = EXCLUDED.text,
              verse_order = EXCLUDED.verse_order
        `,
        values,
      );
    }

    await client.query("COMMIT");

    console.log("NIV seed завершен:");
    console.log(`- Издание: ${edition.locale_code} / ${edition.name}`);
    console.log(`- Книг: ${books.length}`);
    console.log(`- Глав: ${chapters.length}`);
    console.log(`- Стихов: ${verses.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
