import "server-only";

import {
  LESSON_KIND,
  compareLessonsForOrdinal,
  type AppLocale,
  type LessonKind,
  type LessonStatus,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "@/data/access/access-admin-guards.server";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { listBooks } from "@/data/bible/list-books";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { assertLessonReadAccess } from "./lesson-read-access.server";
import { loadGoldenVerseRowsForLesson } from "./load-lesson-verse-texts.server";
import {
  lessonDateToIso,
  lessonHasHomeworkChecks,
  loadLessonInOrganization,
} from "./lesson-shared.server";
import { calendarDateFromIso } from "@/data/school/calendar-date";

import type { LessonDetailVerseRow } from "./load-lesson-verse-texts.server";

export type { LessonDetailVerseRow };

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
  const nextRegular = nextRegularLesson(siblingRows, lesson.id);
  const nextRegularOrdinal = nextRegular?.ordinal ?? null;

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
