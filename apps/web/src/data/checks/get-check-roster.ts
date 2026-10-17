import "server-only";

import type { LessonVerseToRecite, LessonKind, LessonStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import {
  type CheckRosterPupilRow,
  loadCheckLessonAccess,
  loadCheckRosterRows,
  loadVersesToReciteForLesson,
} from "./check-read-shared.server";

export type CheckRosterData =
  | { kind: "not_found" }
  | {
      kind: "roster";
      lessonId: string;
      lessonStatus: LessonStatus;
      lessonKind: LessonKind;
      hasTest: boolean;
      canMutate: boolean;
      yearClosed: boolean;
      versesToRecite: readonly LessonVerseToRecite[];
      pupils: CheckRosterPupilRow[];
    };

export async function getCheckRoster(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
): Promise<CheckRosterData> {
  const access = await loadCheckLessonAccess(db, actorUserId, lessonId);
  if (access.kind === "not_found") return { kind: "not_found" };

  const [versesToRecite, pupils] = await Promise.all([
    loadVersesToReciteForLesson(db, access.lesson),
    loadCheckRosterRows(db, access.lesson),
  ]);

  return {
    kind: "roster",
    lessonId: access.lesson.id,
    lessonStatus: access.lesson.status,
    lessonKind: access.lesson.kind,
    hasTest: access.lesson.hasTest,
    canMutate: access.canMutate,
    yearClosed: access.yearClosed,
    versesToRecite,
    pupils,
  };
}
