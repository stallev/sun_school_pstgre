import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";
import type { CommonVerseRef, VerseRangeInput } from "./verse-range";

export type NormalizeRangeResult =
  | { ok: true; verses: CommonVerseRef[] }
  | { ok: false; error: MutationErr };

const rangeFieldError = (field: string): MutationErr => ({
  ok: false,
  code: MUTATION_ERROR_CODES.VALIDATION,
  message: "teacher.lesson.verse_range_invalid",
  fields: { [field]: "teacher.lesson.verse_range_invalid" },
});

const isPositiveInt = (value: number): boolean => Number.isInteger(value) && value >= 1;

/**
 * Expands a golden-verse range into ordered common verse refs (bible_seed_contract §5.2).
 * `getVersesInChapter` supplies chapter lengths for the book (from `verses_count`).
 */
export const normalizeRange = (
  range: VerseRangeInput,
  getVersesInChapter: (chapter: number) => number | null | undefined,
): NormalizeRangeResult => {
  const { bookId, startChapter, startVerse, endChapter, endVerse } = range;

  if (
    !isPositiveInt(startChapter) ||
    !isPositiveInt(startVerse) ||
    !isPositiveInt(endChapter) ||
    !isPositiveInt(endVerse)
  ) {
    return { ok: false, error: rangeFieldError("verses") };
  }

  if (startChapter > endChapter) {
    return { ok: false, error: rangeFieldError("verses") };
  }
  if (startChapter === endChapter && startVerse > endVerse) {
    return { ok: false, error: rangeFieldError("verses") };
  }

  const verses: CommonVerseRef[] = [];

  for (let chapter = startChapter; chapter <= endChapter; chapter += 1) {
    const versesInChapter = getVersesInChapter(chapter);
    if (versesInChapter === null || versesInChapter === undefined || versesInChapter < 1) {
      return { ok: false, error: rangeFieldError("verses") };
    }

    const verseFrom = chapter === startChapter ? startVerse : 1;
    const verseTo = chapter === endChapter ? endVerse : versesInChapter;

    if (verseFrom < 1 || verseTo > versesInChapter || verseFrom > verseTo) {
      return { ok: false, error: rangeFieldError("verses") };
    }

    for (let verse = verseFrom; verse <= verseTo; verse += 1) {
      verses.push({ bookId, chapter, verse });
    }
  }

  return { ok: true, verses };
};
