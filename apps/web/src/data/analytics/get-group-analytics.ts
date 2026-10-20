import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import { analyticsPeriodFilterSchema } from "./analytics-period";
import type { ResolvedAnalyticsPeriod } from "./analytics-period";
import {
  assertAnalyticsGradeAccess,
  loadActorOrganizationIdForAnalytics,
  resolveAnalyticsPeriodForOrganization,
} from "./analytics-shared.server";
import { computeGroupAnalyticsSnapshot, type GroupAnalyticsSnapshot } from "./analytics-compute.server";
import { mutationFromZodError } from "../access/map-zod-fields";

async function loadGroupAnalyticsFromDb(
  db: PrismaClient,
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<GroupAnalyticsSnapshot> {
  return computeGroupAnalyticsSnapshot(db, gradeId, period);
}

async function loadCachedGroupAnalytics(
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<GroupAnalyticsSnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsGroup(gradeId, period.academicYearId));
  cacheLife("minutes");
  const db = await getPrisma();
  return loadGroupAnalyticsFromDb(db, gradeId, period);
}

export async function getGroupAnalytics(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
  rawPeriod: unknown,
): Promise<MutationResult<GroupAnalyticsSnapshot>> {
  const parsed = analyticsPeriodFilterSchema.safeParse(rawPeriod);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationIdForAnalytics(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;
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
    return { ok: true as const, organizationId, period };
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedGroupAnalytics(gradeId, access.period);
  return { ok: true, data };
}
