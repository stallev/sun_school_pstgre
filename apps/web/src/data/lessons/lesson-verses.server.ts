import "server-only";
import {
  APP_LOCALE,
  BIBLE_TRANSLATION_STATUS,
  MUTATION_ERROR_CODES,
  buildVerseText,
  normalizeRange,
  validateLessonVerseLimit,
  type MutationErr,
  type VerseRangeInput,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

async function loadDefaultTranslationId(tx: Tx, locale: string): Promise<string | null> {
  const row = await tx.bibleTranslation.findFirst({
    where: { locale: locale as typeof APP_LOCALE.RU, isDefault: true, status: BIBLE_TRANSLATION_STATUS.READY },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function loadChapterVerseMax(
  tx: Tx,
  translationId: string,
  bookId: string,
): Promise<Map<number, number>> {
  const rows = await tx.bibleVerse.findMany({
    where: { translationId, bookId },
    select: { chapterNumber: true, verseNumber: true },
  });
  const map = new Map<number, number>();
  for (const row of rows) {
    const current = map.get(row.chapterNumber) ?? 0;
    if (row.verseNumber > current) map.set(row.chapterNumber, row.verseNumber);
  }
  return map;
}

export async function validateLessonVerseRanges(
  tx: Tx,
  gradeLanguage: string,
  verses: readonly VerseRangeInput[],
  maxVersesPerLesson: number,
): Promise<MutationErr | null> {
  if (!validateLessonVerseLimit(verses.length, maxVersesPerLesson)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSES_LIMIT,
      message: "teacher.lesson.verses_limit",
    };
  }

  if (verses.length === 0) return null;

  const translationId = await loadDefaultTranslationId(tx, gradeLanguage);
  if (!translationId) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSE_MISSING,
      message: "teacher.lesson.verses_missing",
      fields: { verses: "teacher.lesson.verses_missing" },
    };
  }

  const synodalTranslationId = await loadDefaultTranslationId(tx, APP_LOCALE.RU);
  if (!synodalTranslationId) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSE_MISSING,
      message: "teacher.lesson.verses_missing",
      fields: { verses: "teacher.lesson.verses_missing" },
    };
  }

  const commonVerses: { bookId: string; chapter: number; verse: number }[] = [];
  for (const range of verses) {
    const chapterMax = await loadChapterVerseMax(tx, synodalTranslationId, range.bookId);
    const normalized = normalizeRange(range, (chapter) => chapterMax.get(chapter) ?? null);
    if (!normalized.ok) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.VALIDATION,
        message: "teacher.lesson.verse_range_invalid",
        fields: { verses: "teacher.lesson.verse_range_invalid" },
      };
    }
    commonVerses.push(...normalized.verses);
  }

  const mapRows = await tx.bibleVerseMap.findMany({
    where: { translationId },
    select: {
      bookId: true,
      chapterNumber: true,
      verseNumber: true,
      commonChapter: true,
      commonVerse: true,
    },
  });

  const bookIds = [...new Set(commonVerses.map((common) => common.bookId))];
  const verseRows = await tx.bibleVerse.findMany({
    where: { translationId, bookId: { in: bookIds } },
    select: { bookId: true, chapterNumber: true, verseNumber: true, text: true },
  });

  const textLookup = new Map<string, string>();
  for (const row of verseRows) {
    textLookup.set(`${row.bookId}:${row.chapterNumber}:${row.verseNumber}`, row.text);
  }

  const built = buildVerseText({
    commonVerses,
    mapRows,
    getVerseText: (ref) => textLookup.get(`${ref.bookId}:${ref.chapter}:${ref.verse}`),
  });

  if (!built.ok) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSE_MISSING,
      message: "teacher.lesson.verses_missing",
      fields: { verses: "teacher.lesson.verses_missing" },
      missing: built.missing,
    };
  }

  return null;
}

export async function findOrCreateGoldenVerse(
  tx: Tx,
  organizationId: string,
  range: VerseRangeInput,
): Promise<string> {
  const existing = await tx.goldenVerse.findFirst({
    where: {
      organizationId,
      bookId: range.bookId,
      startChapter: range.startChapter,
      startVerse: range.startVerse,
      endChapter: range.endChapter,
      endVerse: range.endVerse,
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await tx.goldenVerse.create({
    data: {
      organizationId,
      bookId: range.bookId,
      startChapter: range.startChapter,
      startVerse: range.startVerse,
      endChapter: range.endChapter,
      endVerse: range.endVerse,
    },
    select: { id: true },
  });
  return created.id;
}

export async function replaceLessonGoldenVerses(
  tx: Tx,
  organizationId: string,
  lessonId: string,
  verses: readonly VerseRangeInput[],
): Promise<void> {
  await tx.lessonGoldenVerse.deleteMany({ where: { lessonId } });
  let position = 1;
  for (const range of verses) {
    const goldenVerseId = await findOrCreateGoldenVerse(tx, organizationId, range);
    await tx.lessonGoldenVerse.create({
      data: { lessonId, goldenVerseId, position },
    });
    position += 1;
  }
}
