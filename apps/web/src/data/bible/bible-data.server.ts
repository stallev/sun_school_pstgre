import "server-only";
import {
  APP_LOCALE,
  BIBLE_TRANSLATION_STATUS,
  type AppLocale,
  type VerseMapRow,
} from "@sunschool/domain";
import { getPrisma } from "@/lib/db.server";

export type BibleTranslationRow = {
  id: string;
  code: string;
  locale: AppLocale;
  status: string;
};

export async function readDefaultTranslationByLocale(
  locale: AppLocale,
): Promise<BibleTranslationRow | null> {
  const db = await getPrisma();
  const row = await db.bibleTranslation.findFirst({
    where: {
      locale,
      isDefault: true,
      status: BIBLE_TRANSLATION_STATUS.READY,
    },
    select: { id: true, code: true, locale: true, status: true },
  });
  return row;
}

export async function readTranslationByCode(code: string): Promise<BibleTranslationRow | null> {
  const db = await getPrisma();
  const row = await db.bibleTranslation.findFirst({
    where: { code, status: BIBLE_TRANSLATION_STATUS.READY },
    select: { id: true, code: true, locale: true, status: true },
  });
  return row;
}

export async function readVerseTextRow(
  translationId: string,
  bookId: string,
  chapterNumber: number,
  verseNumber: number,
): Promise<string | null> {
  const db = await getPrisma();
  const row = await db.bibleVerse.findFirst({
    where: { translationId, bookId, chapterNumber, verseNumber },
    select: { text: true },
  });
  return row?.text ?? null;
}

export async function readVerseMapForTranslation(translationId: string): Promise<VerseMapRow[]> {
  const db = await getPrisma();
  const rows = await db.bibleVerseMap.findMany({
    where: { translationId },
    select: {
      bookId: true,
      chapterNumber: true,
      verseNumber: true,
      commonChapter: true,
      commonVerse: true,
    },
  });
  return rows;
}

export async function readChapterVerseMaxByTranslation(
  translationId: string,
  bookId: string,
): Promise<Map<number, number>> {
  const db = await getPrisma();
  const rows = await db.bibleVerse.findMany({
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

export async function readVerseTextsForBook(
  translationId: string,
  bookId: string,
): Promise<Map<string, string>> {
  const db = await getPrisma();
  const rows = await db.bibleVerse.findMany({
    where: { translationId, bookId },
    select: { chapterNumber: true, verseNumber: true, text: true },
  });
  const lookup = new Map<string, string>();
  for (const row of rows) {
    lookup.set(`${row.chapterNumber}:${row.verseNumber}`, row.text);
  }
  return lookup;
}

/** Synodal default translation for common-numbering expansion (bible_seed_contract §5.2). */
export async function readSynodalTranslationId(): Promise<string | null> {
  const row = await readDefaultTranslationByLocale(APP_LOCALE.RU);
  return row?.id ?? null;
}
