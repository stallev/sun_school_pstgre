/**
 * Build NIV relational seed JSON from docs/data/niv_src/Bible-niv (Variant A pack).
 *
 * Output (committed): docs/data/RelSQLData/niv/
 *   - bible_edition_seed.json  (exactly one edition)
 *   - bible_book_seed.json
 *   - bible_chapter_seed.json
 *   - bible_verse_seed.json
 *
 * Load to DB (separate, not implemented here): npm run db:seed:bible:niv
 * Verify (separate): npm run verify:bible-seed:niv
 *
 * Prerequisites: clone/copy Bible-niv under docs/data/niv_src/Bible-niv (gitignored).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  NIV_BOOK_SHORT_TITLES,
  shortTitleForBookName,
  testamentForSortOrder,
} from "./niv-book-short-titles.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const NIV_SRC_DIR = path.join(repoRoot, "docs", "data", "niv_src", "Bible-niv");
const OUT_DIR = path.join(repoRoot, "docs", "data", "RelSQLData", "niv");

const EDITION_CODE = "NIV";
const EXPECTED_BOOK_COUNT = 66;
const EXPECTED_CHAPTER_COUNT = 1189;
const EXPECTED_VERSE_COUNT = 31103;

/** @typedef {{ book: string, count: number, chapters: Array<{ chapter: string|number, verses: Array<{ verse: string|number, text: string }> }> }} NivBookJson */

/**
 * Optional verse text cleanup before seed (typography, OCR). Extend when needed.
 * @param {string} text
 * @returns {string}
 */
function normalizeVerseText(text) {
  return text;
}

function bookJsonPath(bookName) {
  return path.join(NIV_SRC_DIR, `${bookName}.json`);
}

function parsePositiveInt(value, label) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Некорректное число ${label}: ${JSON.stringify(value)}`);
  }
  return n;
}

/**
 * @param {string[]} bookNames
 */
function assertShortTitleCoverage(bookNames) {
  const missing = bookNames.filter((name) => !(name in NIV_BOOK_SHORT_TITLES));
  if (missing.length > 0) {
    throw new Error(
      `В NIV_BOOK_SHORT_TITLES нет записей для: ${missing.join(", ")}`,
    );
  }
  const shorts = bookNames.map((name) => NIV_BOOK_SHORT_TITLES[name]);
  const dup = shorts.filter((s, i) => shorts.indexOf(s) !== i);
  if (dup.length > 0) {
    throw new Error(`Дубли short_title: ${[...new Set(dup)].join(", ")}`);
  }
}

/**
 * @param {NivBookJson} payload
 * @param {number} sortOrder
 */
function validateBookPayload(payload, sortOrder, expectedName) {
  if (payload.book !== expectedName) {
    throw new Error(
      `sort_order=${sortOrder}: ожидалось book=${JSON.stringify(expectedName)}, получено ${JSON.stringify(payload.book)}`,
    );
  }
  const chaptersCount = parsePositiveInt(payload.count, "count");
  if (payload.chapters.length !== chaptersCount) {
    throw new Error(
      `${expectedName}: count=${chaptersCount}, фактически глав ${payload.chapters.length}`,
    );
  }
}

async function loadBooksList() {
  const raw = await readFile(path.join(NIV_SRC_DIR, "Books.json"), "utf8");
  /** @type {string[]} */
  const names = JSON.parse(raw);
  if (names.length !== EXPECTED_BOOK_COUNT) {
    throw new Error(
      `Books.json: ожидалось ${EXPECTED_BOOK_COUNT} книг, получено ${names.length}`,
    );
  }
  return names;
}

/**
 * @param {string} bookName
 * @returns {Promise<NivBookJson>}
 */
async function loadBookJson(bookName) {
  const filePath = bookJsonPath(bookName);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

/**
 * @param {string[]} bookNames
 */
async function buildSeedPayload(bookNames) {
  assertShortTitleCoverage(bookNames);

  const editionSeed = [
    {
      edition_code: EDITION_CODE,
      locale_code: "en",
      name: "New International Version",
      short_name: "NIV",
      is_default: false,
    },
  ];

  /** @type {Array<Record<string, unknown>>} */
  const bookSeed = [];
  /** @type {Array<Record<string, unknown>>} */
  const chapterSeed = [];
  /** @type {Array<Record<string, unknown>>} */
  const verseSeed = [];

  let verseOrder = 0;
  let chapterTotal = 0;
  let verseTotal = 0;

  for (let i = 0; i < bookNames.length; i += 1) {
    const bookName = bookNames[i];
    const sortOrder = i + 1;
    const payload = await loadBookJson(bookName);
    validateBookPayload(payload, sortOrder, bookName);

    const chaptersCount = parsePositiveInt(payload.count, "count");
    bookSeed.push({
      edition_code: EDITION_CODE,
      title: payload.book,
      short_title: shortTitleForBookName(bookName),
      testament: testamentForSortOrder(sortOrder),
      sort_order: sortOrder,
      chapters_count: chaptersCount,
    });

    for (const chapter of payload.chapters) {
      const chapterNumber = parsePositiveInt(chapter.chapter, "chapter");
      const verses = chapter.verses ?? [];
      const versesCount = verses.length;
      chapterTotal += 1;

      chapterSeed.push({
        edition_code: EDITION_CODE,
        book_sort_order: sortOrder,
        chapter_number: chapterNumber,
        verses_count: versesCount,
      });

      let expectedVerse = 1;
      for (const verse of verses) {
        const verseNumber = parsePositiveInt(verse.verse, "verse");
        if (verseNumber !== expectedVerse) {
          throw new Error(
            `${bookName} ${chapterNumber}:${verseNumber} — ожидался стих ${expectedVerse}`,
          );
        }
        expectedVerse += 1;
        verseOrder += 1;
        verseTotal += 1;
        verseSeed.push({
          edition_code: EDITION_CODE,
          book_sort_order: sortOrder,
          chapter_number: chapterNumber,
          verse_number: verseNumber,
          text: normalizeVerseText(verse.text),
          verse_order: verseOrder,
        });
      }
    }
  }

  if (chapterTotal !== EXPECTED_CHAPTER_COUNT) {
    throw new Error(
      `Глав: ожидалось ${EXPECTED_CHAPTER_COUNT}, собрано ${chapterTotal}`,
    );
  }
  if (verseTotal !== EXPECTED_VERSE_COUNT) {
    throw new Error(
      `Стихов: ожидалось ${EXPECTED_VERSE_COUNT}, собрано ${verseTotal}`,
    );
  }

  return { editionSeed, bookSeed, chapterSeed, verseSeed };
}

async function writeSeedFiles(payload) {
  await mkdir(OUT_DIR, { recursive: true });
  const files = [
    ["bible_edition_seed.json", payload.editionSeed],
    ["bible_book_seed.json", payload.bookSeed],
    ["bible_chapter_seed.json", payload.chapterSeed],
    ["bible_verse_seed.json", payload.verseSeed],
  ];
  for (const [name, data] of files) {
    const outPath = path.join(OUT_DIR, name);
    await writeFile(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`Источник: ${NIV_SRC_DIR}`);
  console.log(`Выход:    ${OUT_DIR}`);
  if (dryRun) {
    console.log("Режим: --dry-run (файлы не записываются)");
  }

  const bookNames = await loadBooksList();
  const payload = await buildSeedPayload(bookNames);

  console.log("Сводка:");
  console.log(`- Изданий: ${payload.editionSeed.length}`);
  console.log(`- Книг: ${payload.bookSeed.length}`);
  console.log(`- Глав: ${payload.chapterSeed.length}`);
  console.log(`- Стихов: ${payload.verseSeed.length}`);

  if (!dryRun) {
    await writeSeedFiles(payload);
    console.log("Запись завершена.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
