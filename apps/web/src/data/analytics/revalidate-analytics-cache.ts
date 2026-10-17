import "server-only";

import { updateTag } from "next/cache";
import type { PrismaClient } from "@sunschool/db";
import { CACHE_TAGS } from "@/lib/cache-tags";

export function revalidateAnalyticsForGradeYear(gradeId: string, yearId: string): void {
  updateTag(CACHE_TAGS.analyticsGroup(gradeId, yearId));
  updateTag(CACHE_TAGS.analyticsConducted(gradeId, yearId));
  updateTag(CACHE_TAGS.analyticsDataQuality(gradeId, yearId));
}

export function revalidateAnalyticsForPupilYear(pupilId: string, yearId: string): void {
  updateTag(CACHE_TAGS.analyticsPupil(pupilId, yearId));
}

export function revalidateAnalyticsForOrganizationYear(organizationId: string, yearId: string): void {
  updateTag(CACHE_TAGS.analyticsSchool(organizationId, yearId));
}

export async function revalidateAnalyticsCachesForLessonCheck(
  db: PrismaClient,
  pupilId: string,
  lessonId: string,
): Promise<void> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      gradeId: true,
      academicYearId: true,
      grade: { select: { organizationId: true } },
    },
  });
  if (!lesson) return;

  revalidateAnalyticsForGradeYear(lesson.gradeId, lesson.academicYearId);
  revalidateAnalyticsForPupilYear(pupilId, lesson.academicYearId);
  revalidateAnalyticsForOrganizationYear(lesson.grade.organizationId, lesson.academicYearId);
}
