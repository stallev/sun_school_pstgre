import "server-only";

import type { PrismaClient } from "@sunschool/db";
import { loadLessonsListPage } from "@/data/lessons/load-lessons-list-page.server";
import { getCurrentLesson } from "./get-current-lesson";

export type CheckEntryPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | { kind: "redirect"; lessonId: string }
  | { kind: "empty"; gradeId: string; canMutate: boolean };

export async function loadCheckEntryPage(
  db: PrismaClient,
  actorUserId: string,
): Promise<CheckEntryPageData> {
  const list = await loadLessonsListPage(db, actorUserId, null);
  if (list.kind === "no_active_year") {
    return { kind: "no_active_year" };
  }
  if (list.kind === "unassigned") {
    return { kind: "unassigned" };
  }

  const current = await getCurrentLesson(db, actorUserId, list.gradeId);
  if (current.kind === "lesson") {
    return { kind: "redirect", lessonId: current.lessonId };
  }

  return {
    kind: "empty",
    gradeId: list.gradeId,
    canMutate: list.canMutate,
  };
}
