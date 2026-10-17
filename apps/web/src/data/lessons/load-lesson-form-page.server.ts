import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  LESSON_KIND,
  type AppLocale,
  type LessonKind,
  type VerseRangeInput,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr, userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { buildVerseTextForRange } from "@/data/bible/get-verse-text";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { listBooks, type BibleBookListItem } from "@/data/bible/list-books";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { isoFromCalendarDate } from "@/data/school/calendar-date";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import {
  assertLessonActorForExisting,
  lessonDateToIso,
  lessonHasHomeworkChecks,
  loadLessonInOrganization,
} from "./lesson-shared.server";

export type LessonFormGradeOption = { gradeId: string; name: string; language: AppLocale };
export type LessonFormTeacherOption = { userId: string; displayName: string; isSelf: boolean };
export type LessonFormVerseRow = VerseRangeInput & { text: string | null; hasMissing: boolean };

export type LessonFormPageData =
  | { kind: "no_active_year" }
  | { kind: "not_found" }
  | {
      kind: "form";
      mode: "create" | "edit";
      lessonId?: string;
      gradeId: string;
      grades: LessonFormGradeOption[];
      isAdmin: boolean;
      canMutate: boolean;
      yearName: string;
      yearStartIso: string;
      yearEndIso: string;
      ordinal: number | null;
      teachers: LessonFormTeacherOption[];
      books: BibleBookListItem[];
      translationCode: string;
      maxVersesPerLesson: number;
      values: {
        title: string;
        lessonDate: string;
        kind: LessonKind;
        leadTeacherId: string;
        body: string;
        hasTest: boolean;
        verses: LessonFormVerseRow[];
      };
      kindLocked: boolean;
      checksLockedFields: boolean;
    };

async function loadGradeOptions(
  db: PrismaClient,
  actorUserId: string,
  yearId: string,
  organizationId: string,
  isAdmin: boolean,
): Promise<LessonFormGradeOption[]> {
  if (isAdmin) {
    const rows = await db.grade.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, language: true },
    });
    return rows.map((row) => ({
      gradeId: row.id,
      name: row.name,
      language: row.language as AppLocale,
    }));
  }
  const assignments = await db.teacherAssignment.findMany({
    where: { userId: actorUserId, academicYearId: yearId },
    select: { grade: { select: { id: true, name: true, language: true } } },
    orderBy: { grade: { name: "asc" } },
  });
  return assignments.map((row) => ({
    gradeId: row.grade.id,
    name: row.grade.name,
    language: row.grade.language as AppLocale,
  }));
}

async function loadTeachersForGrade(
  db: PrismaClient,
  gradeId: string,
  yearId: string,
  actorUserId: string,
): Promise<LessonFormTeacherOption[]> {
  const rows = await db.teacherAssignment.findMany({
    where: { gradeId, academicYearId: yearId },
    select: {
      user: { select: { id: true, lastName: true, firstName: true, middleName: true } },
    },
    orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
  });
  return rows.map((row) => ({
    userId: row.user.id,
    displayName: formatDisplayName(row.user),
    isSelf: row.user.id === actorUserId,
  }));
}

async function buildVerseRows(
  translationCode: string,
  verses: VerseRangeInput[],
): Promise<LessonFormVerseRow[]> {
  const rows: LessonFormVerseRow[] = [];
  for (const range of verses) {
    const built = await buildVerseTextForRange(translationCode, range);
    rows.push({
      ...range,
      text: built.ok ? built.text : null,
      hasMissing: !built.ok,
    });
  }
  return rows;
}

export async function loadLessonFormCreatePage(
  db: PrismaClient,
  actorUserId: string,
  preferredGradeId: string | null,
): Promise<LessonFormPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const isAdmin = await userHasAdminRole(db, actorUserId);
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true, startsOn: true, endsOn: true },
  });
  if (!year) return { kind: "no_active_year" };

  const grades = await loadGradeOptions(db, actorUserId, year.id, organizationId, isAdmin);
  if (grades.length === 0) return { kind: "not_found" };

  const gradeId =
    preferredGradeId && grades.some((g) => g.gradeId === preferredGradeId)
      ? preferredGradeId
      : grades[0]?.gradeId;
  if (!gradeId) return { kind: "not_found" };

  if (!isAdmin) {
    const scope = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (scope) return { kind: "not_found" };
  }

  const grade = grades.find((g) => g.gradeId === gradeId)!;
  const translation = await resolveGroupTranslation(grade.language);
  if (!translation.ok) return { kind: "not_found" };

  const settings = await db.gradeSettings.findUnique({
    where: { gradeId_academicYearId: { gradeId, academicYearId: year.id } },
    select: { maxVersesPerLesson: true },
  });
  const teachers = await loadTeachersForGrade(db, gradeId, year.id, actorUserId);
  const defaultLead =
    teachers.find((t) => t.isSelf)?.userId ?? teachers[0]?.userId ?? actorUserId;
  const books = await listBooks();
  const today = isoTodayUtc();
  const yearStartIso = isoFromCalendarDate(year.startsOn);
  const yearEndIso = isoFromCalendarDate(year.endsOn);
  const lessonDate =
    today >= yearStartIso && today <= yearEndIso ? today : yearStartIso;

  return {
    kind: "form",
    mode: "create",
    gradeId,
    grades,
    isAdmin,
    canMutate: true,
    yearName: year.name,
    yearStartIso,
    yearEndIso,
    ordinal: null,
    teachers,
    books,
    translationCode: translation.code,
    maxVersesPerLesson: settings?.maxVersesPerLesson ?? 3,
    values: {
      title: "",
      lessonDate,
      kind: LESSON_KIND.REGULAR,
      leadTeacherId: defaultLead,
      body: "",
      hasTest: false,
      verses: [],
    },
    kindLocked: false,
    checksLockedFields: false,
  };
}

export async function loadLessonFormEditPage(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
): Promise<LessonFormPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const lesson = await loadLessonInOrganization(db, lessonId, organizationId);
  if (isMutationErr(lesson)) return { kind: "not_found" };

  const actor = await assertLessonActorForExisting(db, actorUserId, organizationId, lesson);
  if (isMutationErr(actor)) return { kind: "not_found" };

  const year = await db.academicYear.findFirst({
    where: { id: lesson.academicYearId, organizationId },
    select: { id: true, name: true, status: true, startsOn: true, endsOn: true },
  });
  if (!year) return { kind: "not_found" };

  const isAdmin = actor.mode === "admin";
  const canMutate = isAdmin || year.status === ACADEMIC_YEAR_STATUS.ACTIVE;
  const grades = await loadGradeOptions(db, actorUserId, year.id, organizationId, isAdmin);
  const grade = grades.find((g) => g.gradeId === lesson.gradeId);
  if (!grade) return { kind: "not_found" };

  const translation = await resolveGroupTranslation(grade.language);
  if (!translation.ok) return { kind: "not_found" };

  const settings = await db.gradeSettings.findUnique({
    where: { gradeId_academicYearId: { gradeId: lesson.gradeId, academicYearId: year.id } },
    select: { maxVersesPerLesson: true },
  });
  const teachers = await loadTeachersForGrade(db, lesson.gradeId, year.id, actorUserId);
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
  const verseRanges: VerseRangeInput[] = linked.map((row) => ({
    bookId: row.goldenVerse.bookId,
    startChapter: row.goldenVerse.startChapter,
    startVerse: row.goldenVerse.startVerse,
    endChapter: row.goldenVerse.endChapter,
    endVerse: row.goldenVerse.endVerse,
  }));
  const verses = await buildVerseRows(translation.code, verseRanges);
  const hasChecks = await lessonHasHomeworkChecks(db, lesson.id);
  const ordinalRow = await db.lesson.findUnique({
    where: { id: lesson.id },
    select: { ordinal: true },
  });

  return {
    kind: "form",
    mode: "edit",
    lessonId: lesson.id,
    gradeId: lesson.gradeId,
    grades,
    isAdmin,
    canMutate,
    yearName: year.name,
    yearStartIso: isoFromCalendarDate(year.startsOn),
    yearEndIso: isoFromCalendarDate(year.endsOn),
    ordinal: ordinalRow?.ordinal ?? null,
    teachers,
    books: await listBooks(),
    translationCode: translation.code,
    maxVersesPerLesson: settings?.maxVersesPerLesson ?? 3,
    values: {
      title: lesson.title,
      lessonDate: lessonDateToIso(lesson.lessonDate),
      kind: lesson.kind as LessonKind,
      leadTeacherId: lesson.leadTeacherId,
      body: lesson.body ?? "",
      hasTest: lesson.hasTest,
      verses,
    },
    kindLocked: hasChecks,
    checksLockedFields: hasChecks,
  };
}
