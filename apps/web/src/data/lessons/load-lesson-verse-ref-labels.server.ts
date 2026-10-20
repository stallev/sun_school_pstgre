import "server-only";

import { LESSON_KIND, type AppLocale } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { listBooks } from "@/data/bible/list-books";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";

export async function loadLessonVerseRefLabels(
  db: PrismaClient,
  lessonId: string,
  gradeLanguage: AppLocale,
  locale: AppLocale,
): Promise<string | null> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { kind: true },
  });
  if (!lesson || lesson.kind !== LESSON_KIND.REGULAR) {
    return null;
  }

  const translation = await resolveGroupTranslation(gradeLanguage);
  if (!translation.ok) {
    return null;
  }

  const books = await listBooks();
  const bookById = new Map(books.map((book) => [book.id, book]));
  const linked = await db.lessonGoldenVerse.findMany({
    where: { lessonId },
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

  const labels = linked.map((row) => {
    const range = row.goldenVerse;
    const book = bookById.get(range.bookId);
    return book ? formatVerseRefLabel(book, locale, range) : range.bookId;
  });

  return labels.length > 0 ? labels.join(", ") : null;
}
