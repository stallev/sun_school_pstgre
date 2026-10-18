import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { userHasAdminRole } from "../access/access-admin-guards.server";
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

export type DeletedDataInPeriodSnapshot = {
  gradeId: string;
  period: ResolvedAnalyticsPeriod;
  deletedChildCount: number;
  latestResolvedAtIso: string | null;
};

async function loadCachedDeletedDataInPeriod(
  db: PrismaClient,
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<DeletedDataInPeriodSnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsDeletedData(gradeId, period.academicYearId));
  cacheLife("minutes");

  const { gte, lte } = periodDateRange(period);

  const rows = await db.deletionRequest.findMany({
    where: {
      type: DELETION_REQUEST_TYPE.CHILD_DATA,
      status: DELETION_REQUEST_STATUS.DONE,
      resolvedAt: { gte, lte },
      subjectPupilId: { not: null },
      subjectPupil: {
        enrollments: {
          some: { gradeId, academicYearId: period.academicYearId },
        },
      },
    },
    select: { subjectPupilId: true, resolvedAt: true },
  });

  const pupilIds = new Set<string>();
  let latestResolvedAt: Date | null = null;
  for (const row of rows) {
    if (row.subjectPupilId) pupilIds.add(row.subjectPupilId);
    if (row.resolvedAt && (!latestResolvedAt || row.resolvedAt > latestResolvedAt)) {
      latestResolvedAt = row.resolvedAt;
    }
  }

  return {
    gradeId,
    period,
    deletedChildCount: pupilIds.size,
    latestResolvedAtIso: latestResolvedAt ? latestResolvedAt.toISOString() : null,
  };
}

export async function getDeletedDataInPeriod(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
  rawPeriod: unknown,
): Promise<MutationResult<DeletedDataInPeriodSnapshot>> {
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

    const period = await resolveAnalyticsPeriodForOrganization(tx, organizationId, parsed.data);
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

  const data = await loadCachedDeletedDataInPeriod(db, gradeId, access);
  return { ok: true, data };
}
