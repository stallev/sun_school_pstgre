import "server-only";

import { LESSON_KIND, type AppLocale, type LessonKind } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { buildVerseTextForRange } from "@/data/bible/get-verse-text";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { listBooks } from "@/data/bible/list-books";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";

export type LessonDetailVerseRow = {
  refLabel: string;
  text: string | null;
  hasMissing: boolean;
};

export async function loadGoldenVerseRowsForLesson(
  db: PrismaClient,
  targetLessonId: string,
  lessonKind: LessonKind,
  locale: AppLocale,
  translationCode: string,
  bookById: Map<string, Awaited<ReturnType<typeof listBooks>>[number]>,
): Promise<LessonDetailVerseRow[]> {
  if (lessonKind !== LESSON_KIND.REGULAR) {
    return [];
  }
  const linked = await db.lessonGoldenVerse.findMany({
    where: { lessonId: targetLessonId },
    orderBy: { position: "asc" },
    select: {
      goldenVerse: {
        select: {
          bookId: true,
          startChapter: true,
          startVerse: true,
          endChapter: true,
          endVerse: true,
        },
      },
    },
  });

  const rows: LessonDetailVerseRow[] = [];
  for (const row of linked) {
    const range = {
      bookId: row.goldenVerse.bookId,
      startChapter: row.goldenVerse.startChapter,
      startVerse: row.goldenVerse.startVerse,
      endChapter: row.goldenVerse.endChapter,
      endVerse: row.goldenVerse.endVerse,
    };
    const built = await buildVerseTextForRange(translationCode, range);
    const book = bookById.get(range.bookId);
    rows.push({
      refLabel: book ? formatVerseRefLabel(book, locale, range) : range.bookId,
      text: built.ok ? built.text : null,
      hasMissing: !built.ok,
    });
  }
  return rows;
}

/**
 * Verse texts for the check screens (P24 §5.2б). Callers have already passed the lesson read
 * access check, so this loader only resolves the group translation and the texts.
 */
export async function loadLessonVerseTexts(
  db: PrismaClient,
  lesson: { id: string; kind: LessonKind },
  locale: AppLocale,
): Promise<LessonDetailVerseRow[]> {
  if (lesson.kind !== LESSON_KIND.REGULAR) {
    return [];
  }
  const row = await db.lesson.findUnique({
    where: { id: lesson.id },
    select: { grade: { select: { language: true } } },
  });
  if (!row) return [];

  const translation = await resolveGroupTranslation(row.grade.language as AppLocale);
  if (!translation.ok) return [];

  const books = await listBooks();
  const bookById = new Map(books.map((book) => [book.id, book]));
  return loadGoldenVerseRowsForLesson(db, lesson.id, lesson.kind, locale, translation.code, bookById);
}
