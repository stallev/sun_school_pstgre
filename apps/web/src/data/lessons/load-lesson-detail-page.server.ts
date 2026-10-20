import "server-only";

import {
  LESSON_KIND,
  compareLessonsForOrdinal,
  previousRegularLesson,
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
      recitingVerses: LessonDetailVerseRow[];
      previousRegularOrdinal: number | null;
      nextRegularOrdinal: number | null;
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

type LessonSiblingRow = {
  id: string;
  kind: LessonKind;
  lessonDate: string;
  createdAt: string;
  ordinal: number;
};

const nextRegularLesson = (
  lessons: readonly LessonSiblingRow[],
  currentLessonId: string,
): LessonSiblingRow | null => {
  const ordered = [...lessons].sort(compareLessonsForOrdinal);
  const currentIndex = ordered.findIndex((lesson) => lesson.id === currentLessonId);
  if (currentIndex < 0) {
    return null;
  }
  for (let index = currentIndex + 1; index < ordered.length; index += 1) {
    const lesson = ordered[index];
    if (!lesson) continue;
    if (lesson.kind === LESSON_KIND.REGULAR) {
      return lesson;
    }
  }
  return null;
};

async function loadGoldenVerseRowsForLesson(
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
  const lessonKind = lesson.kind as LessonKind;
  const verses = await loadGoldenVerseRowsForLesson(
    db,
    lesson.id,
    lessonKind,
    locale,
    translation.code,
    bookById,
  );

  const siblings = await db.lesson.findMany({
    where: { gradeId: lesson.gradeId, academicYearId: lesson.academicYearId },
    select: { id: true, kind: true, lessonDate: true, createdAt: true, ordinal: true },
  });
  const siblingRows: LessonSiblingRow[] = siblings.map((row) => ({
    id: row.id,
    kind: row.kind as LessonKind,
    lessonDate: lessonDateToIso(row.lessonDate),
    createdAt: row.createdAt.toISOString(),
    ordinal: row.ordinal,
  }));
  const previousRegular = previousRegularLesson(siblingRows, lesson.id);
  const nextRegular = nextRegularLesson(siblingRows, lesson.id);
  const ordinalByLessonId = new Map(siblingRows.map((row) => [row.id, row.ordinal]));
  const previousRegularOrdinal =
    previousRegular ? (ordinalByLessonId.get(previousRegular.id) ?? null) : null;
  const nextRegularOrdinal = nextRegular?.ordinal ?? null;
  const recitingVerses =
    previousRegular
      ? await loadGoldenVerseRowsForLesson(
          db,
          previousRegular.id,
          LESSON_KIND.REGULAR,
          locale,
          translation.code,
          bookById,
        )
      : [];

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
    lessonKind,
    recitingVerses,
    previousRegularOrdinal,
    nextRegularOrdinal,
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
