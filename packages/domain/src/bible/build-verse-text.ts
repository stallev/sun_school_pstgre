import type { CommonVerseRef, VerseMapRow } from "./verse-range";
import { resolveTranslationRef } from "./resolve-translation-ref";

export type TranslationVerseRef = {
  bookId: string;
  chapter: number;
  verse: number;
};

export type BuildVerseTextInput = {
  commonVerses: readonly CommonVerseRef[];
  mapRows: readonly VerseMapRow[];
  getVerseText: (ref: TranslationVerseRef) => string | null | undefined;
};

export type BuildVerseTextResult =
  | { ok: true; text: string }
  | { ok: false; missing: CommonVerseRef[] };

/**
 * Concatenates verse texts in group translation order (bible_seed_contract §5.2).
 * Missing rows in `bible_verse` yield `missing[]` (R-9).
 */
export const buildVerseText = (input: BuildVerseTextInput): BuildVerseTextResult => {
  const { commonVerses, mapRows, getVerseText } = input;
  const parts: string[] = [];
  const missing: CommonVerseRef[] = [];

  for (const common of commonVerses) {
    const translation = resolveTranslationRef(
      common.bookId,
      common.chapter,
      common.verse,
      mapRows,
    );
    const text = getVerseText({
      bookId: common.bookId,
      chapter: translation.chapterNumber,
      verse: translation.verseNumber,
    });
    if (text === null || text === undefined || text.trim() === "") {
      missing.push(common);
      continue;
    }
    parts.push(text.trim());
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true, text: parts.join(" ") };
};
