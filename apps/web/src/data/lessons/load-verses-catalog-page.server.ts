import "server-only";

import { ACADEMIC_YEAR_STATUS, type AppLocale } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { buildVerseTextForRange } from "@/data/bible/get-verse-text";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { listBooks, type BibleBookListItem } from "@/data/bible/list-books";
import { stripEditorialVerseMarkup } from "@/lib/bible/strip-editorial-verse-markup";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";

export type VersesCatalogUsage = {
  lessonId: string;
  ordinal: number;
  title: string;
};

export type VersesCatalogRow = {
  refLabel: string;
  text: string | null;
  hasMissing: boolean;
  usages: VersesCatalogUsage[];
};

export type VersesCatalogPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | {
      kind: "catalog";
      pickerGradeId: string;
      books: BibleBookListItem[];
      yearName: string;
      rows: VersesCatalogRow[];
      locale: AppLocale;
    };

export async function loadVersesCatalogPage(
  db: PrismaClient,
  actorUserId: string,
  preferredGradeId: string | null,
  locale: AppLocale,
): Promise<VersesCatalogPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const isAdmin = await userHasAdminRole(db, actorUserId);
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true },
  });
  if (!year) return { kind: "no_active_year" };

  let grades: { gradeId: string; name: string }[];
  if (isAdmin) {
    const rows = await db.grade.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    grades = rows.map((row) => ({ gradeId: row.id, name: row.name }));
  } else {
    const assignments = await db.teacherAssignment.findMany({
      where: { userId: actorUserId, academicYearId: year.id },
      select: { grade: { select: { id: true, name: true } } },
      orderBy: { grade: { name: "asc" } },
    });
    grades = assignments.map((row) => ({ gradeId: row.grade.id, name: row.grade.name }));
  }
  if (grades.length === 0) return { kind: "unassigned" };

  const pickerGradeId = grades[0]?.gradeId;
  if (!pickerGradeId) return { kind: "unassigned" };

  const pickerGrade = await db.grade.findFirst({
    where: { id: pickerGradeId },
    select: { language: true },
  });
  if (!pickerGrade) return { kind: "unassigned" };

  const translation = await resolveGroupTranslation(pickerGrade.language as AppLocale);
  if (!translation.ok) return { kind: "unassigned" };

  const books = await listBooks();
  const bookById = new Map(books.map((book) => [book.id, book]));
  const gradeIds = grades.map((g) => g.gradeId);

  const links = await db.lessonGoldenVerse.findMany({
    where: { lesson: { gradeId: { in: gradeIds }, academicYearId: year.id } },
    select: {
      goldenVerseId: true,
      goldenVerse: {
        select: {
          bookId: true,
          startChapter: true,
          startVerse: true,
          endChapter: true,
          endVerse: true,
        },
      },
      lesson: { select: { id: true, ordinal: true, title: true } },
    },
    orderBy: [{ lesson: { lessonDate: "desc" } }, { position: "asc" }],
  });

  const byVerse = new Map<string, VersesCatalogRow>();
  for (const link of links) {
    const range = {
      bookId: link.goldenVerse.bookId,
      startChapter: link.goldenVerse.startChapter,
      startVerse: link.goldenVerse.startVerse,
      endChapter: link.goldenVerse.endChapter,
      endVerse: link.goldenVerse.endVerse,
    };
    const key = `${range.bookId}:${range.startChapter}:${range.startVerse}:${range.endChapter}:${range.endVerse}`;
    const book = bookById.get(range.bookId);
    const refLabel = book ? formatVerseRefLabel(book, locale, range) : key;
    let row = byVerse.get(key);
    if (!row) {
      const built = await buildVerseTextForRange(translation.code, range);
      row = {
        refLabel,
        text: built.ok ? stripEditorialVerseMarkup(built.text) : null,
        hasMissing: !built.ok,
        usages: [],
      };
      byVerse.set(key, row);
    }
    row.usages.push({
      lessonId: link.lesson.id,
      ordinal: link.lesson.ordinal,
      title: link.lesson.title,
    });
  }

  return {
    kind: "catalog",
    pickerGradeId,
    books,
    yearName: year.name,
    rows: [...byVerse.values()].sort((a, b) => a.refLabel.localeCompare(b.refLabel, locale)),
    locale,
  };
}
