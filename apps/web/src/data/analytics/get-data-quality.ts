import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { analyticsPeriodFilterSchema } from "./analytics-period";
import type { ResolvedAnalyticsPeriod } from "./analytics-period";
import {
  assertAnalyticsGradeAccess,
  loadActorOrganizationIdForAnalytics,
  periodDateRange,
  resolveAnalyticsPeriodForOrganization,
} from "./analytics-shared.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { userHasAdminRole } from "../access/access-admin-guards.server";

export type DataQualitySnapshot = {
  gradeId: string;
  period: ResolvedAnalyticsPeriod;
  missingPupilRecordsOnCheckedLessons: number;
};

async function loadCachedDataQuality(
  db: PrismaClient,
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<DataQualitySnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsDataQuality(gradeId, period.academicYearId));
  cacheLife("minutes");

  const { gte, lte } = periodDateRange(period);

  const checkedLessons = await db.lesson.findMany({
    where: {
      gradeId,
      academicYearId: period.academicYearId,
      lessonDate: { gte, lte },
      checks: { some: { homeworkChecked: true } },
    },
    select: { id: true },
  });

  if (checkedLessons.length === 0) {
    return { gradeId, period, missingPupilRecordsOnCheckedLessons: 0 };
  }

  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId: period.academicYearId, endsOn: null },
    select: { pupilId: true },
  });
  const pupilIds = enrollments.map((row) => row.pupilId);
  const lessonIds = checkedLessons.map((row) => row.id);

  const checks = await db.homeworkCheck.findMany({
    where: { lessonId: { in: lessonIds }, pupilId: { in: pupilIds } },
    select: { lessonId: true, pupilId: true },
  });
  const checkKeys = new Set(checks.map((row) => `${row.lessonId}:${row.pupilId}`));

  let missing = 0;
  for (const lessonId of lessonIds) {
    for (const pupilId of pupilIds) {
      if (!checkKeys.has(`${lessonId}:${pupilId}`)) {
        missing += 1;
      }
    }
  }

  return { gradeId, period, missingPupilRecordsOnCheckedLessons: missing };
}

export async function getDataQuality(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
  rawPeriod: unknown,
): Promise<MutationResult<DataQualitySnapshot>> {
  const parsed = analyticsPeriodFilterSchema.safeParse(rawPeriod);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationIdForAnalytics(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;

    if (!(await userHasAdminRole(tx, actorUserId))) {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.FORBIDDEN,
        message: "common.errors.forbidden",
      };
    }

    const period = await resolveAnalyticsPeriodForOrganization(
      tx,
      organizationId,
      parsed.data,
    );
    if (isMutationErr(period)) return period;
    const scope = await assertAnalyticsGradeAccess(
      tx,
      actorUserId,
      organizationId,
      gradeId,
      parsed.data.academicYearId,
    );
    if (scope) return scope;
    return period;
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedDataQuality(db, gradeId, access);
  return { ok: true, data };
}
