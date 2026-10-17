import "server-only";

import type { LessonVerseToRecite, LessonKind, LessonStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { lessonDateToIso } from "@/data/lessons/lesson-shared.server";
import {
  type CheckRosterPupilRow,
  loadCheckLessonAccess,
  loadCheckRosterRows,
  loadVersesToReciteForLesson,
} from "./check-read-shared.server";

export type LessonCheckTableData =
  | { kind: "not_found" }
  | {
      kind: "table";
      lessonId: string;
      title: string;
      ordinal: number;
      lessonDateIso: string;
      lessonStatus: LessonStatus;
      lessonKind: LessonKind;
      hasTest: boolean;
      canMutate: boolean;
      yearClosed: boolean;
      versesToRecite: readonly LessonVerseToRecite[];
      rows: CheckRosterPupilRow[];
      checkedCount: number;
    };

export async function getLessonTable(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
): Promise<LessonCheckTableData> {
  const access = await loadCheckLessonAccess(db, actorUserId, lessonId);
  if (access.kind === "not_found") return { kind: "not_found" };

  const [versesToRecite, rows] = await Promise.all([
    loadVersesToReciteForLesson(db, access.lesson),
    loadCheckRosterRows(db, access.lesson),
  ]);
  const checkedCount = rows.filter((row) => row.homeworkChecked).length;

  return {
    kind: "table",
    lessonId: access.lesson.id,
    title: access.lesson.title,
    ordinal: access.lesson.ordinal,
    lessonDateIso: lessonDateToIso(access.lesson.lessonDate),
    lessonStatus: access.lesson.status,
    lessonKind: access.lesson.kind,
    hasTest: access.lesson.hasTest,
    canMutate: access.canMutate,
    yearClosed: access.yearClosed,
    versesToRecite,
    rows,
    checkedCount,
  };
}
