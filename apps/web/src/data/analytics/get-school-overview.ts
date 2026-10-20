import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { SAMPLE_LAYER, type MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import { analyticsPeriodFilterSchema } from "./analytics-period";
import type { ResolvedAnalyticsPeriod } from "./analytics-period";
import {
  assertAnalyticsSchoolAccess,
  loadActorOrganizationIdForAnalytics,
  resolveAnalyticsPeriodForOrganization,
} from "./analytics-shared.server";
import { computeGroupAnalyticsSnapshot } from "./analytics-compute.server";
import { mutationFromZodError } from "../access/map-zod-fields";

export type SchoolGroupOverviewRow = {
  gradeId: string;
  gradeName: string;
  layerACount: number;
  totalPupils: number;
  attendancePercent: number | null;
  hasCheckedLessonsInPeriod: boolean;
};

export type SchoolOverviewSnapshot = {
  period: ResolvedAnalyticsPeriod;
  groups: SchoolGroupOverviewRow[];
};

async function loadSchoolOverviewFromDb(
  db: PrismaClient,
  organizationId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<SchoolOverviewSnapshot> {
  const grades = await db.grade.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const groups: SchoolGroupOverviewRow[] = [];
  for (const grade of grades) {
    const snapshot = await computeGroupAnalyticsSnapshot(db, grade.id, period);
    groups.push({
      gradeId: grade.id,
      gradeName: grade.name,
      layerACount: snapshot.sampleCounts[SAMPLE_LAYER.A],
      totalPupils:
        snapshot.sampleCounts[SAMPLE_LAYER.A] +
        snapshot.sampleCounts[SAMPLE_LAYER.B] +
        snapshot.sampleCounts[SAMPLE_LAYER.C] +
        snapshot.sampleCounts[SAMPLE_LAYER.D],
      attendancePercent: snapshot.kpi.attendancePercent,
      hasCheckedLessonsInPeriod: snapshot.hasCheckedLessonsInPeriod,
    });
  }

  return { period, groups };
}

async function loadCachedSchoolOverview(
  organizationId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<SchoolOverviewSnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsSchool(organizationId, period.academicYearId));
  cacheLife("minutes");
  const db = await getPrisma();
  return loadSchoolOverviewFromDb(db, organizationId, period);
}

export async function getSchoolOverview(
  db: PrismaClient,
  actorUserId: string,
  rawPeriod: unknown,
): Promise<MutationResult<SchoolOverviewSnapshot>> {
  const parsed = analyticsPeriodFilterSchema.safeParse(rawPeriod);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationIdForAnalytics(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;
    const admin = await assertAnalyticsSchoolAccess(tx, actorUserId);
    if (admin) return admin;
    const period = await resolveAnalyticsPeriodForOrganization(
      tx,
      organizationId,
      parsed.data,
    );
    if (isMutationErr(period)) return period;
    return { ok: true as const, organizationId, period };
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedSchoolOverview(access.organizationId, access.period);
  return { ok: true, data };
}
