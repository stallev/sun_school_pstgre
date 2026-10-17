import "server-only";

import {
  LESSON_STATUS,
  resolveVersesToRecite,
  type LessonKind,
  type LessonStatus,
  type LessonVerseToRecite,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "@/data/access/access-admin-guards.server";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { calendarDateFromIso } from "@/data/school/calendar-date";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { assertLessonReadAccess } from "@/data/lessons/lesson-read-access.server";
import { lessonDateToIso, loadLessonInOrganization } from "@/data/lessons/lesson-shared.server";

export type CheckLessonAccess =
  | { kind: "not_found" }
  | {
      kind: "ok";
      organizationId: string;
      lesson: {
        id: string;
        gradeId: string;
        academicYearId: string;
        lessonDate: Date;
        kind: LessonKind;
        status: LessonStatus;
        hasTest: boolean;
        title: string;
        ordinal: number;
      };
      canMutate: boolean;
      yearClosed: boolean;
    };

export type CheckRosterPupilRow = {
  pupilId: string;
  displayName: string;
  birthYear: number | null;
  addedLater: boolean;
  checkId: string | null;
  present: boolean;
  homeworkChecked: boolean;
  testScore: number | null;
  notebookScore: number | null;
  singing: boolean;
  late: boolean;
  pointsTotal: number | null;
  updatedAt: string | null;
  verseScores: { lessonVerseId: string; score: number }[];
};

export async function loadCheckLessonAccess(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
): Promise<CheckLessonAccess> {
  const organizationId = await getDefaultOrganizationId(db);
  const lesson = await loadLessonInOrganization(db, lessonId, organizationId);
  if (isMutationErr(lesson)) return { kind: "not_found" };

  const access = await assertLessonReadAccess(db, actorUserId, organizationId, lesson);
  if (isMutationErr(access)) return { kind: "not_found" };

  const ordinalRow = await db.lesson.findUnique({
    where: { id: lesson.id },
    select: { ordinal: true, status: true },
  });

  return {
    kind: "ok",
    organizationId,
    lesson: {
      id: lesson.id,
      gradeId: lesson.gradeId,
      academicYearId: lesson.academicYearId,
      lessonDate: lesson.lessonDate,
      kind: lesson.kind as LessonKind,
      status: (ordinalRow?.status ?? lesson.status) as LessonStatus,
      hasTest: lesson.hasTest,
      title: lesson.title,
      ordinal: ordinalRow?.ordinal ?? 0,
    },
    canMutate: access.canMutate,
    yearClosed: access.yearClosed,
  };
}

export async function loadVersesToReciteForLesson(
  db: PrismaClient,
  lesson: { id: string; gradeId: string; academicYearId: string },
): Promise<readonly LessonVerseToRecite[]> {
  const rows = await db.lesson.findMany({
    where: { gradeId: lesson.gradeId, academicYearId: lesson.academicYearId },
    select: {
      id: true,
      lessonDate: true,
      createdAt: true,
      kind: true,
      verses: {
        select: { id: true, position: true },
        orderBy: { position: "asc" },
      },
    },
  });
  const lessons = rows.map((row) => ({
    id: row.id,
    lessonDate: lessonDateToIso(row.lessonDate),
    createdAt: row.createdAt.toISOString(),
    kind: row.kind as LessonKind,
    verses: row.verses.map((verse) => ({
      lessonVerseId: verse.id,
      position: verse.position,
    })),
  }));
  return resolveVersesToRecite(lessons, lesson.id);
}

export async function loadCheckRosterRows(
  db: PrismaClient,
  lesson: { id: string; gradeId: string; academicYearId: string; lessonDate: Date },
): Promise<CheckRosterPupilRow[]> {
  const lessonDate = calendarDateFromIso(lessonDateToIso(lesson.lessonDate));
  const enrollments = await db.enrollment.findMany({
    where: {
      gradeId: lesson.gradeId,
      academicYearId: lesson.academicYearId,
      startsOn: { lte: lessonDate },
      OR: [{ endsOn: null }, { endsOn: { gte: lessonDate } }],
    },
    select: {
      pupilId: true,
      pupil: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
          birthDate: true,
        },
      },
    },
  });

  const checks = await db.homeworkCheck.findMany({
    where: { lessonId: lesson.id },
    select: {
      id: true,
      pupilId: true,
      present: true,
      homeworkChecked: true,
      testScore: true,
      notebookScore: true,
      singing: true,
      late: true,
      pointsTotal: true,
      updatedAt: true,
      verseScores: { select: { lessonVerseId: true, score: true } },
      pupil: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
          birthDate: true,
        },
      },
    },
  });

  const enrolledIds = new Set(enrollments.map((row) => row.pupilId));
  const byPupilId = new Map<string, CheckRosterPupilRow>();

  for (const row of enrollments) {
    byPupilId.set(row.pupilId, {
      pupilId: row.pupilId,
      displayName: formatDisplayName(row.pupil),
      birthYear: row.pupil.birthDate ? row.pupil.birthDate.getUTCFullYear() : null,
      addedLater: false,
      checkId: null,
      present: false,
      homeworkChecked: false,
      testScore: null,
      notebookScore: null,
      singing: false,
      late: false,
      pointsTotal: null,
      updatedAt: null,
      verseScores: [],
    });
  }

  for (const check of checks) {
    const existing = byPupilId.get(check.pupilId);
    const base = existing ?? {
      pupilId: check.pupilId,
      displayName: formatDisplayName(check.pupil),
      birthYear: check.pupil.birthDate ? check.pupil.birthDate.getUTCFullYear() : null,
      addedLater: !enrolledIds.has(check.pupilId),
      checkId: null,
      present: false,
      homeworkChecked: false,
      testScore: null,
      notebookScore: null,
      singing: false,
      late: false,
      pointsTotal: null,
      updatedAt: null,
      verseScores: [],
    };
    byPupilId.set(check.pupilId, {
      ...base,
      checkId: check.id,
      present: check.present,
      homeworkChecked: check.homeworkChecked,
      testScore: check.testScore,
      notebookScore: check.notebookScore,
      singing: check.singing,
      late: check.late,
      pointsTotal: check.pointsTotal,
      updatedAt: check.updatedAt.toISOString(),
      verseScores: check.verseScores.map((row) => ({
        lessonVerseId: row.lessonVerseId,
        score: row.score,
      })),
    });
  }

  return [...byPupilId.values()].sort((left, right) =>
    left.displayName.localeCompare(right.displayName, "ru"),
  );
}

/** Flow spec §3 — nearest HELD lesson on or before today in the school calendar. */
export const pickCurrentHeldLessonId = (
  lessons: readonly { id: string; lessonDateIso: string; status: LessonStatus }[],
  todayIso: string,
): string | null => {
  const candidates = lessons.filter(
    (row) => row.status === LESSON_STATUS.HELD && row.lessonDateIso <= todayIso,
  );
  if (candidates.length === 0) {
    return null;
  }
  candidates.sort((left, right) => right.lessonDateIso.localeCompare(left.lessonDateIso));
  return candidates[0]?.id ?? null;
};
