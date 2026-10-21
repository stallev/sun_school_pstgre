import "server-only";

import { LESSON_KIND, type AppLocale, type LessonKind } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { listBooks } from "@/data/bible/list-books";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";

const verseRefSeparator = " · ";

const formatLinkedVerseLabels = (
  linked: {
    goldenVerse: {
      bookId: string;
      startChapter: number;
      startVerse: number;
      endChapter: number;
      endVerse: number;
    };
  }[],
  bookById: Map<string, { shortRu: string; shortEn: string }>,
  locale: AppLocale,
): string | null => {
  const labels = linked.map((row) => {
    const range = row.goldenVerse;
    const book = bookById.get(range.bookId);
    return book ? formatVerseRefLabel(book, locale, range) : range.bookId;
  });
  return labels.length > 0 ? labels.join(verseRefSeparator) : null;
};

export async function loadLessonVerseRefLabelsForLessons(
  db: PrismaClient,
  lessons: { lessonId: string; kind: LessonKind }[],
  gradeLanguage: AppLocale,
  locale: AppLocale,
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  for (const lesson of lessons) {
    result.set(lesson.lessonId, null);
  }

  const regularIds = lessons
    .filter((lesson) => lesson.kind === LESSON_KIND.REGULAR)
    .map((lesson) => lesson.lessonId);
  if (regularIds.length === 0) {
    return result;
  }

  const translation = await resolveGroupTranslation(gradeLanguage);
  if (!translation.ok) {
    return result;
  }

  const books = await listBooks();
  const bookById = new Map(books.map((book) => [book.id, book]));
  const linked = await db.lessonGoldenVerse.findMany({
    where: { lessonId: { in: regularIds } },
    orderBy: [{ lessonId: "asc" }, { position: "asc" }],
    select: {
      lessonId: true,
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

  const byLesson = new Map<string, typeof linked>();
  for (const row of linked) {
    const bucket = byLesson.get(row.lessonId) ?? [];
    bucket.push(row);
    byLesson.set(row.lessonId, bucket);
  }

  for (const lessonId of regularIds) {
    const rows = byLesson.get(lessonId) ?? [];
    result.set(lessonId, formatLinkedVerseLabels(rows, bookById, locale));
  }

  return result;
}

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

  const map = await loadLessonVerseRefLabelsForLessons(
    db,
    [{ lessonId, kind: lesson.kind as LessonKind }],
    gradeLanguage,
    locale,
  );
  return map.get(lessonId) ?? null;
}
