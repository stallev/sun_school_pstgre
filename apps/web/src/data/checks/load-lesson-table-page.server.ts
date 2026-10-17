import "server-only";

import { buildScoringSnapshot } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { loadCheckLessonAccess } from "./check-read-shared.server";
import { getLessonTable } from "./get-lesson-table";
import type { CheckRosterPupilRow } from "./check-read-shared.server";
import type { LessonVerseToRecite, LessonKind, LessonStatus, ScoringSnapshot } from "@sunschool/domain";

export type LessonTablePupilRow = {
  pupilId: string;
  displayName: string;
  present: boolean;
  homeworkChecked: boolean;
  testScore: number | null;
  notebookScore: number | null;
  singing: boolean;
  late: boolean;
  pointsTotal: number | null;
  updatedAt: string | null;
  verseScores: Record<string, number | null>;
};

export type LessonTablePageData =
  | { kind: "not_found" }
  | {
      kind: "page";
      lessonId: string;
      lessonOrdinal: number;
      lessonTitle: string;
      lessonDateIso: string;
      lessonStatus: LessonStatus;
      lessonKind: LessonKind;
      hasTest: boolean;
      canMutate: boolean;
      yearClosed: boolean;
      isAdmin: boolean;
      checkedCount: number;
      versesToRecite: readonly LessonVerseToRecite[];
      scoring: ScoringSnapshot;
      pupils: LessonTablePupilRow[];
    };

const mapPupil = (
  pupil: CheckRosterPupilRow,
  verseIds: readonly string[],
): LessonTablePupilRow => {
  const scoreByVerse = new Map(pupil.verseScores.map((entry) => [entry.lessonVerseId, entry.score]));
  const verseScores: Record<string, number | null> = {};
  for (const id of verseIds) {
    verseScores[id] = scoreByVerse.get(id) ?? null;
  }
  return {
    pupilId: pupil.pupilId,
    displayName: pupil.displayName,
    present: pupil.present,
    homeworkChecked: pupil.homeworkChecked,
    testScore: pupil.testScore,
    notebookScore: pupil.notebookScore,
    singing: pupil.singing,
    late: pupil.late,
    pointsTotal: pupil.pointsTotal,
    updatedAt: pupil.updatedAt,
    verseScores,
  };
};

export async function loadLessonTablePage(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
  isAdmin: boolean,
): Promise<LessonTablePageData> {
  const table = await getLessonTable(db, actorUserId, lessonId);
  if (table.kind === "not_found") return { kind: "not_found" };

  const access = await loadCheckLessonAccess(db, actorUserId, lessonId);
  if (access.kind === "not_found") return { kind: "not_found" };

  const settings = await db.gradeSettings.findUnique({
    where: {
      gradeId_academicYearId: {
        gradeId: access.lesson.gradeId,
        academicYearId: access.lesson.academicYearId,
      },
    },
    select: {
      useVerses: true,
      useTest: true,
      useNotebook: true,
      useSinging: true,
      maxVersesPerLesson: true,
      weights: true,
    },
  });
  const weightsJson = (settings?.weights ?? {}) as Record<string, number>;
  const scoring = buildScoringSnapshot({
    useVerses: settings?.useVerses ?? true,
    useTest: settings?.useTest ?? true,
    useNotebook: settings?.useNotebook ?? true,
    useSinging: settings?.useSinging ?? true,
    maxVersesPerLesson: settings?.maxVersesPerLesson ?? 3,
    weights: weightsJson,
  });

  const verseIds = table.versesToRecite.map((verse) => verse.lessonVerseId);
  const pupils = table.rows.map((row) => mapPupil(row, verseIds));

  return {
    kind: "page",
    lessonId: table.lessonId,
    lessonOrdinal: table.ordinal,
    lessonTitle: table.title,
    lessonDateIso: table.lessonDateIso,
    lessonStatus: table.lessonStatus,
    lessonKind: table.lessonKind,
    hasTest: table.hasTest,
    canMutate: table.canMutate,
    yearClosed: table.yearClosed,
    isAdmin,
    checkedCount: table.checkedCount,
    versesToRecite: table.versesToRecite,
    scoring,
    pupils,
  };
}
