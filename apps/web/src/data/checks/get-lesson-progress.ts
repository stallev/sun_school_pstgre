import "server-only";

import type { LessonStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { loadCheckLessonAccess, loadCheckRosterRows } from "./check-read-shared.server";

export type LessonCheckProgressData =
  | { kind: "not_found" }
  | {
      kind: "progress";
      lessonId: string;
      lessonStatus: LessonStatus;
      checkedCount: number;
      totalCount: number;
    };

export async function getLessonProgress(
  db: PrismaClient,
  actorUserId: string,
  lessonId: string,
): Promise<LessonCheckProgressData> {
  const access = await loadCheckLessonAccess(db, actorUserId, lessonId);
  if (access.kind === "not_found") return { kind: "not_found" };

  const roster = await loadCheckRosterRows(db, access.lesson);
  const totalCount = roster.length;
  const checkedCount = roster.filter((row) => row.homeworkChecked).length;

  return {
    kind: "progress",
    lessonId: access.lesson.id,
    lessonStatus: access.lesson.status,
    checkedCount,
    totalCount,
  };
}
