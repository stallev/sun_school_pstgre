import "server-only";

import {
  buildSuggestionVerseList,
  type AppLocale,
  type SuggestionCheckVerses,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { buildVerseTextForRange } from "@/data/bible/get-verse-text";
import { listBooks } from "@/data/bible/list-books";
import type { SuggestionVerseView } from "@/lib/achievements/pupil-achievement-panel-types";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";

type SuggestionVersesInput = {
  gradeLanguage: AppLocale;
  evidenceCheckIds: string[];
};

/**
 * Golden-verse list of each suggestion (contract section 3): only verses restorable through
 * evidence check -> lesson -> lesson_golden_verse -> golden_verse -> bible_verse, text in the group translation.
 */
export async function loadSuggestionVerses(
  db: PrismaClient,
  inputs: SuggestionVersesInput[],
  locale: AppLocale,
  timeZone: string,
): Promise<SuggestionVerseView[][]> {
  const checkIds = [...new Set(inputs.flatMap((input) => input.evidenceCheckIds))];
  if (checkIds.length === 0) return inputs.map(() => []);

  const [books, rows] = await Promise.all([
    listBooks(),
    db.homeworkCheck.findMany({
      where: { id: { in: checkIds } },
      select: {
        id: true,
        lesson: {
          select: {
            lessonDate: true,
            verses: {
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
            },
          },
        },
      },
    }),
  ]);
  const bookById = new Map(books.map((book) => [book.id, book]));
  const checkById = new Map(rows.map((row) => [row.id, row]));

  const result: SuggestionVerseView[][] = [];
  for (const input of inputs) {
    const translation = await resolveGroupTranslation(input.gradeLanguage);
    const dateByReference = new Map<string, string>();
    const checks: SuggestionCheckVerses[] = [];
    for (const checkId of input.evidenceCheckIds) {
      const check = checkById.get(checkId);
      if (!check) continue;
      const dateLabel = formatLessonDisplayDate(check.lesson.lessonDate.toISOString().slice(0, 10), {
        locale,
        timeZone,
      });
      const verses: SuggestionCheckVerses["verses"][number][] = [];
      for (const { goldenVerse: range } of check.lesson.verses) {
        const book = bookById.get(range.bookId);
        const reference = book ? formatVerseRefLabel(book, locale, range) : range.bookId;
        const built = translation.ok ? await buildVerseTextForRange(translation.code, range) : null;
        verses.push({ reference, text: built?.ok ? built.text : null });
        if (!dateByReference.has(reference)) dateByReference.set(reference, dateLabel);
      }
      checks.push({ checkId, verses });
    }
    result.push(
      buildSuggestionVerseList(input.evidenceCheckIds, checks).map((item) => ({
        ...item,
        dateLabel: dateByReference.get(item.reference) ?? null,
      })),
    );
  }
  return result;
}
