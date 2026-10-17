import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  buildVerseText,
  normalizeRange,
  type BuildVerseTextResult,
  type VerseRangeInput,
} from "@sunschool/domain";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { hasServerEnv } from "@/lib/env.server";
import {
  readChapterVerseMaxByTranslation,
  readSynodalTranslationId,
  readTranslationByCode,
  readVerseMapForTranslation,
  readVerseTextRow,
  readVerseTextsForBook,
} from "./bible-data.server";

export type VerseTextIndex = {
  translationCode: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
};

export async function readVerseTextByIndexFromDb(index: VerseTextIndex): Promise<string | null> {
  const translation = await readTranslationByCode(index.translationCode);
  if (!translation) return null;
  return readVerseTextRow(
    translation.id,
    index.bookId,
    index.chapterNumber,
    index.verseNumber,
  );
}

async function readCachedVerseTextByIndex(index: VerseTextIndex): Promise<string | null> {
  "use cache";
  cacheTag(CACHE_TAGS.bibleTranslation(index.translationCode));
  cacheLife("max");
  return readVerseTextByIndexFromDb(index);
}

/** Single verse text in translation coordinates (bible_seed_contract §12). */
export async function getVerseTextByIndex(index: VerseTextIndex): Promise<string | null> {
  if (!hasServerEnv()) return null;
  return readCachedVerseTextByIndex(index);
}

export async function readBuildVerseTextForRangeFromDb(
  translationCode: string,
  range: VerseRangeInput,
): Promise<BuildVerseTextResult> {
  const translation = await readTranslationByCode(translationCode);
  if (!translation) {
    return { ok: false, missing: [] };
  }

  const synodalId = await readSynodalTranslationId();
  if (!synodalId) {
    return { ok: false, missing: [] };
  }

  const chapterMax = await readChapterVerseMaxByTranslation(synodalId, range.bookId);
  const normalized = normalizeRange(range, (chapter) => chapterMax.get(chapter) ?? null);
  if (!normalized.ok) {
    return { ok: false, missing: [] };
  }

  const mapRows = await readVerseMapForTranslation(translation.id);
  const textLookup = await readVerseTextsForBook(translation.id, range.bookId);

  return buildVerseText({
    commonVerses: normalized.verses,
    mapRows,
    getVerseText: (ref) => textLookup.get(`${ref.chapter}:${ref.verse}`),
  });
}

async function readCachedBuildVerseTextForRange(
  translationCode: string,
  range: VerseRangeInput,
): Promise<BuildVerseTextResult> {
  "use cache";
  cacheTag(CACHE_TAGS.bibleTranslation(translationCode));
  cacheLife("max");
  return readBuildVerseTextForRangeFromDb(translationCode, range);
}

/** Builds concatenated verse text or `missing[]` for lesson forms (bible_seed_contract §5.2, R-9). */
export async function buildVerseTextForRange(
  translationCode: string,
  range: VerseRangeInput,
): Promise<BuildVerseTextResult> {
  if (!hasServerEnv()) {
    return { ok: false, missing: [] };
  }
  return readCachedBuildVerseTextForRange(translationCode, range);
}
