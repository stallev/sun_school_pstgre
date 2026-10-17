import "server-only";

import {
  LESSON_KIND,
  type AppLocale,
  type LessonKind,
  type LessonStatus,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "@/data/access/access-admin-guards.server";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { buildVerseTextForRange } from "@/data/bible/get-verse-text";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { listBooks } from "@/data/bible/list-books";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";
import { assertLessonReadAccess } from "./lesson-read-access.server";
import {
  lessonDateToIso,
  lessonHasHomeworkChecks,
  loadLessonInOrganization,
} from "./lesson-shared.server";
import { calendarDateFromIso } from "@/data/school/calendar-date";

export type LessonDetailVerseRow = {
  refLabel: string;
  text: string | null;
  hasMissing: boolean;
};

export type LessonDetailPageData =
  | { kind: "not_found" }
  | {
      kind: "detail";
      lessonId: string;
      ordinal: number;
      title: string;
      lessonDateIso: string;
      lessonKind: LessonKind;
      leadName: string;
      hasTest: boolean;
      body: string | null;
      verses: LessonDetailVerseRow[];
      gradeName: string;
      yearName: string;
      canMutate: boolean;
      yearClosed: boolean;
      hasChecks: boolean;
      status: LessonStatus;
      checkedCount: number;
      totalPupils: number;
      locale: AppLocale;
    };

export async function loadLessonDetailPage(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
  locale: AppLocale,
): Promise<LessonDetailPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const lesson = await loadLessonInOrganization(db, lessonId, organizationId);
  if (isMutationErr(lesson)) return { kind: "not_found" };

  const access = await assertLessonReadAccess(db, actorUserId, organizationId, lesson);
  if (isMutationErr(access)) return { kind: "not_found" };

  const year = await db.academicYear.findFirst({
    where: { id: lesson.academicYearId, organizationId },
    select: { name: true },
  });
  const grade = await db.grade.findFirst({
    where: { id: lesson.gradeId, organizationId },
    select: { name: true, language: true },
  });
  if (!year || !grade) return { kind: "not_found" };

  const translation = await resolveGroupTranslation(grade.language as AppLocale);
  if (!translation.ok) return { kind: "not_found" };

  const books = await listBooks();
  const bookById = new Map(books.map((book) => [book.id, book]));
  const linked = await db.lessonGoldenVerse.findMany({
    where: { lessonId: lesson.id },
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

  const verses: LessonDetailVerseRow[] = [];
  if ((lesson.kind as LessonKind) === LESSON_KIND.REGULAR) {
    for (const row of linked) {
      const range = {
        bookId: row.goldenVerse.bookId,
        startChapter: row.goldenVerse.startChapter,
        startVerse: row.goldenVerse.startVerse,
        endChapter: row.goldenVerse.endChapter,
        endVerse: row.goldenVerse.endVerse,
      };
      const built = await buildVerseTextForRange(translation.code, range);
      const book = bookById.get(range.bookId);
      verses.push({
        refLabel: book ? formatVerseRefLabel(book, locale, range) : range.bookId,
        text: built.ok ? built.text : null,
        hasMissing: !built.ok,
      });
    }
  }

  const leadTeacher = await db.appUser.findFirst({
    where: { id: lesson.leadTeacherId },
    select: { lastName: true, firstName: true, middleName: true },
  });
  const ordinalRow = await db.lesson.findUnique({
    where: { id: lesson.id },
    select: { ordinal: true, status: true },
  });
  const hasChecks = await lessonHasHomeworkChecks(db, lesson.id);
  const lessonDate = calendarDateFromIso(lessonDateToIso(lesson.lessonDate));
  const totalPupils = await db.enrollment.count({
    where: {
      gradeId: lesson.gradeId,
      academicYearId: lesson.academicYearId,
      startsOn: { lte: lessonDate },
      OR: [{ endsOn: null }, { endsOn: { gte: lessonDate } }],
    },
  });
  const checkedCount = await db.homeworkCheck.count({
    where: { lessonId: lesson.id, homeworkChecked: true },
  });

  return {
    kind: "detail",
    lessonId: lesson.id,
    ordinal: ordinalRow?.ordinal ?? 0,
    title: lesson.title,
    lessonDateIso: lessonDateToIso(lesson.lessonDate),
    lessonKind: lesson.kind as LessonKind,
    leadName: leadTeacher ? formatDisplayName(leadTeacher) : "",
    hasTest: lesson.hasTest,
    body: lesson.body,
    verses,
    gradeName: grade.name,
    yearName: year.name,
    canMutate: access.canMutate,
    yearClosed: access.yearClosed,
    hasChecks,
    status: (ordinalRow?.status ?? lesson.status) as LessonStatus,
    checkedCount,
    totalPupils,
    locale,
  };
}
