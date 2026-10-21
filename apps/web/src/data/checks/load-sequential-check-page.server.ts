import "server-only";

import { buildScoringSnapshot, LESSON_KIND } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { lessonDateToIso } from "@/data/lessons/lesson-shared.server";
import { loadCheckLessonAccess } from "./check-read-shared.server";
import { getCheckRoster } from "./get-check-roster";
import type {
  SequentialCheckPageData,
  SequentialCheckPupil,
} from "./sequential-check-types";

export type { SequentialCheckPageData, SequentialCheckPupil } from "./sequential-check-types";
export { isCorrectionMode } from "./sequential-check-types";

const mapPupil = (
  pupil: {
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
  },
  verseIds: readonly string[],
): SequentialCheckPupil => {
  const scoreByVerse = new Map(pupil.verseScores.map((entry) => [entry.lessonVerseId, entry.score]));
  const verseScores: Record<string, number | null> = {};
  for (const id of verseIds) {
    verseScores[id] = scoreByVerse.get(id) ?? null;
  }
  return {
    pupilId: pupil.pupilId,
    displayName: pupil.displayName,
    birthYear: pupil.birthYear,
    addedLater: pupil.addedLater,
    checkId: pupil.checkId,
    present: pupil.checkId ? pupil.present : null,
    homeworkChecked: pupil.homeworkChecked,
    testScore: pupil.testScore,
    notebookScore: pupil.notebookScore,
    singing: pupil.singing,
    comment: "",
    late: pupil.late,
    pointsTotal: pupil.pointsTotal,
    updatedAt: pupil.updatedAt,
    verseScores,
  };
};

export async function loadSequentialCheckPage(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
  isAdmin: boolean,
): Promise<SequentialCheckPageData> {
  const roster = await getCheckRoster(db, actorUserId, lessonId);
  if (roster.kind === "not_found") return { kind: "not_found" };

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

  const verseIds = roster.versesToRecite.map((verse) => verse.lessonVerseId);
  const pupils = roster.pupils.map((pupil) => mapPupil(pupil, verseIds));

  const comments = await db.homeworkCheck.findMany({
    where: { lessonId, pupilId: { in: pupils.map((p) => p.pupilId) } },
    select: { pupilId: true, comment: true },
  });
  const commentByPupil = new Map(comments.map((row) => [row.pupilId, row.comment ?? ""]));
  for (const pupil of pupils) {
    pupil.comment = commentByPupil.get(pupil.pupilId) ?? "";
  }

  let previousLessonOrdinal: number | null = null;
  if (roster.versesToRecite.length > 0) {
    const previous = await db.lesson.findFirst({
      where: {
        gradeId: access.lesson.gradeId,
        academicYearId: access.lesson.academicYearId,
        kind: LESSON_KIND.REGULAR,
        lessonDate: { lt: access.lesson.lessonDate },
      },
      orderBy: [{ lessonDate: "desc" }, { createdAt: "desc" }],
      select: { ordinal: true },
    });
    previousLessonOrdinal = previous?.ordinal ?? null;
  }

  return {
    kind: "page",
    lessonId: roster.lessonId,
    lessonOrdinal: access.lesson.ordinal,
    lessonTitle: access.lesson.title,
    lessonDateIso: lessonDateToIso(access.lesson.lessonDate),
    lessonStatus: roster.lessonStatus,
    lessonKind: roster.lessonKind,
    hasTest: roster.hasTest,
    canMutate: roster.canMutate,
    yearClosed: roster.yearClosed,
    isAdmin,
    versesToRecite: roster.versesToRecite,
    previousLessonOrdinal,
    scoring,
    pupils,
  };
}
