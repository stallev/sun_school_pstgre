import "server-only";

import { updateTag } from "next/cache";
import type { PrismaClient } from "@sunschool/db";
import { CACHE_TAGS } from "@/lib/cache-tags";

export function revalidateBricksCaches(pupilId: string, yearId: string): void {
  updateTag(CACHE_TAGS.bricksBalance(pupilId, yearId));
  updateTag(CACHE_TAGS.bricksLedger(pupilId, yearId));
  updateTag(CACHE_TAGS.analyticsPupilYears(pupilId));
}

export function revalidateBricksCachesForPupils(
  pupilIds: readonly string[],
  yearId: string,
): void {
  for (const pupilId of pupilIds) {
    revalidateBricksCaches(pupilId, yearId);
  }
}

export async function revalidateBricksCachesForLessonCheck(
  db: PrismaClient,
  pupilId: string,
  lessonId: string,
): Promise<void> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { academicYearId: true },
  });
  if (!lesson) return;
  revalidateBricksCaches(pupilId, lesson.academicYearId);
}
