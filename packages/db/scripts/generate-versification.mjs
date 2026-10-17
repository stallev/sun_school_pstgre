/**
 * Builds versification.json from the RST + local NIV chapter seeds (NIV is gitignored).
 *
 * Chapter-by-chapter, never by a global verse_order join:
 * - Psalms are computed by `mapPsalmChapter`; only hand-verified heading cases are written here.
 * - Other chapters with equal RST/NIV verse counts are identity — no rows.
 * - Chapters whose counts differ get explicit rows for every NIV verse:
 *   a run of consecutive mismatched chapters with equal totals is aligned by position
 *   (a verse crossing a chapter boundary); a lone chapter is identity, NIV verses past the
 *   Synodal end collapse onto its last verse; KNOWN_CHAPTERS cover hand-verified cases.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const dataDir = path.join(root, "docs/my_specs/Bible/data/RelSQLData");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));

const rstCh = readJson("bible_chapter_seed.json");
const nivCh = readJson("niv/bible_chapter_seed.json");
const nivV = readJson("niv/bible_verse_seed.json");

const PSALMS_SORT_ORDER = 19;

/**
 * Hand-verified chapters (checked against verse texts). Segment = [nivFrom, nivTo, commonChapter, commonFrom, collapse?]:
 * consecutive NIV verses map to consecutive Synodal verses, or all onto `commonFrom` when `collapse` is set.
 * Verses not listed are identity (non-Psalms) or fall back to the computed Psalm mapping.
 */
const KNOWN_CHAPTERS = [
  // Rom. 16:25–27 is the doxology Synodal prints as Rom. 14:24–26.
  { book: 45, chapter: 16, segments: [[25, 27, 14, 24]] },
  // Lev. 14: Synodal 14:55 covers NIV 14:55–56.
  { book: 3, chapter: 14, segments: [[56, 56, 14, 55], [57, 57, 14, 56]] },
  // 2 Cor. 13: Synodal 13:12 covers NIV 13:12–13.
  { book: 47, chapter: 13, segments: [[13, 13, 13, 12], [14, 14, 13, 13]] },
  // Psalms whose Synodal verse 1 is a bare heading while verse counts are equal.
  { book: 19, chapter: 13, segments: [[1, 4, 12, 2], [5, 6, 12, 6, true]] },
  { book: 19, chapter: 87, segments: [[1, 2, 86, 2, true]] },
  { book: 19, chapter: 90, segments: [[1, 4, 89, 2], [5, 6, 89, 6, true]] },
];

const countKey = (book, chapter) => `${book}:${chapter}`;
const rstCount = new Map(rstCh.map((c) => [countKey(c.book_sort_order, c.chapter_number), c.verses_count]));
const nivCount = new Map(nivCh.map((c) => [countKey(c.book_sort_order, c.chapter_number), c.verses_count]));

const mismatched = nivCh
  .filter((c) => c.book_sort_order !== PSALMS_SORT_ORDER)
  .filter((c) => rstCount.get(countKey(c.book_sort_order, c.chapter_number)) !== c.verses_count)
  .map((c) => ({ book: c.book_sort_order, chapter: c.chapter_number }));

const exceptions = [];
const push = (book, chapter, verse, commonChapter, commonVerse) =>
  exceptions.push({
    bookSortOrder: book,
    chapterNumber: chapter,
    verseNumber: verse,
    commonChapter,
    commonVerse,
  });

const handled = new Set();

for (const known of KNOWN_CHAPTERS) {
  const { book, chapter } = known;
  const own = nivCount.get(countKey(book, chapter));
  for (let verse = 1; verse <= own; verse += 1) {
    const segment = known.segments.find(([from, to]) => verse >= from && verse <= to);
    if (segment) {
      const [from, , commonChapter, commonFrom, collapse] = segment;
      push(book, chapter, verse, commonChapter, collapse ? commonFrom : commonFrom + (verse - from));
    } else if (book !== PSALMS_SORT_ORDER) {
      push(book, chapter, verse, chapter, verse);
    }
  }
  handled.add(countKey(book, chapter));
}

// A mismatched chapter that a known chapter feeds (Rom. 14) stays identity on the NIV side.
for (const m of mismatched) {
  const key = countKey(m.book, m.chapter);
  if (handled.has(key)) continue;
  const fed = KNOWN_CHAPTERS.some(
    (k) => k.book === m.book && k.segments.some(([, , commonChapter]) => commonChapter === m.chapter),
  );
  if (!fed) continue;
  for (let verse = 1; verse <= nivCount.get(key); verse += 1) {
    push(m.book, m.chapter, verse, m.chapter, verse);
  }
  handled.add(key);
}

const pending = mismatched.filter((m) => !handled.has(countKey(m.book, m.chapter)));
const runs = [];
for (const item of pending) {
  const last = runs.at(-1)?.at(-1);
  if (last && last.book === item.book && last.chapter + 1 === item.chapter) {
    runs.at(-1).push(item);
  } else {
    runs.push([item]);
  }
}

for (const run of runs) {
  const book = run[0].book;
  const nivTotal = run.reduce((sum, c) => sum + nivCount.get(countKey(book, c.chapter)), 0);
  const rstTotal = run.reduce((sum, c) => sum + rstCount.get(countKey(book, c.chapter)), 0);

  if (run.length === 1) {
    const { chapter } = run[0];
    const own = nivCount.get(countKey(book, chapter));
    const rstLast = rstCount.get(countKey(book, chapter));
    for (let verse = 1; verse <= own; verse += 1) {
      push(book, chapter, verse, chapter, Math.min(verse, rstLast));
    }
    continue;
  }

  if (nivTotal !== rstTotal) {
    throw new Error(`Run ${book}:${run[0].chapter}-${run.at(-1).chapter} totals differ (${nivTotal} vs ${rstTotal})`);
  }

  const rstStream = run.flatMap(({ chapter }) =>
    Array.from({ length: rstCount.get(countKey(book, chapter)) }, (_, i) => ({ chapter, verse: i + 1 })),
  );
  let position = 0;
  for (const { chapter } of run) {
    for (let verse = 1; verse <= nivCount.get(countKey(book, chapter)); verse += 1) {
      const target = rstStream[position];
      push(book, chapter, verse, target.chapter, target.verse);
      position += 1;
    }
  }
}

fs.writeFileSync(
  path.join(root, "packages/db/src/seed/bible/versification.json"),
  `${JSON.stringify({ version: 1, exceptions }, null, 2)}\n`,
);

const { planVerseMapRows, loadVersification } = await import("../src/seed/bible/build-verse-map.ts");
const versification = await loadVersification();
const bookIdBySortOrder = new Map(Array.from({ length: 66 }, (_, i) => [i + 1, `book-${i + 1}`]));
const { rows, incompleteChapters } = planVerseMapRows({
  nivVerses: nivV,
  rstChapters: rstCh,
  nivChapters: nivCh,
  versification,
  bookIdBySortOrder,
});

console.log(
  `Wrote ${exceptions.length} explicit rows for ${mismatched.length} mismatched chapters; ` +
    `plan rows: ${rows.length}; incomplete: ${incompleteChapters.join(", ") || "none"}`,
);

if (incompleteChapters.length > 0) {
  process.exitCode = 1;
}
