import "server-only";

import type { LessonVerseToRecite, LessonKind, LessonStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import {
  loadCheckLessonAccess,
  loadCheckRosterRows,
  loadVersesToReciteForLesson,
} from "./check-read-shared.server";

export type CheckRecordData =
  | { kind: "not_found" }
  | {
      kind: "record";
      lessonId: string;
      lessonStatus: LessonStatus;
      lessonKind: LessonKind;
      hasTest: boolean;
      canMutate: boolean;
      yearClosed: boolean;
      versesToRecite: readonly LessonVerseToRecite[];
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
      comment: string | null;
      late: boolean;
      pointsTotal: number | null;
      updatedAt: string | null;
      verseScores: { lessonVerseId: string; score: number }[];
    };

export async function getCheckRecord(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
  pupilId: string,
): Promise<CheckRecordData> {
  const access = await loadCheckLessonAccess(db, actorUserId, lessonId);
  if (access.kind === "not_found") return { kind: "not_found" };

  const [versesToRecite, roster] = await Promise.all([
    loadVersesToReciteForLesson(db, access.lesson),
    loadCheckRosterRows(db, access.lesson),
  ]);
  const row = roster.find((entry) => entry.pupilId === pupilId);
  if (!row) return { kind: "not_found" };

  let comment: string | null = null;
  if (row.checkId) {
    const check = await db.homeworkCheck.findUnique({
      where: { id: row.checkId },
      select: { comment: true },
    });
    comment = check?.comment ?? null;
  }

  return {
    kind: "record",
    lessonId: access.lesson.id,
    lessonStatus: access.lesson.status,
    lessonKind: access.lesson.kind,
    hasTest: access.lesson.hasTest,
    canMutate: access.canMutate,
    yearClosed: access.yearClosed,
    versesToRecite,
    pupilId: row.pupilId,
    displayName: row.displayName,
    birthYear: row.birthYear,
    addedLater: row.addedLater,
    checkId: row.checkId,
    present: row.present,
    homeworkChecked: row.homeworkChecked,
    testScore: row.testScore,
    notebookScore: row.notebookScore,
    singing: row.singing,
    comment,
    late: row.late,
    pointsTotal: row.pointsTotal,
    updatedAt: row.updatedAt,
    verseScores: row.verseScores,
  };
}
