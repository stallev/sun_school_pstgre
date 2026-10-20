import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  computeRatingMetric,
  rankRatingRows,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import {
  assertAnalyticsGradeAccess,
  loadActorOrganizationIdForAnalytics,
} from "./analytics-shared.server";

export type RatingTableRow = {
  pupilId: string;
  displayName: string;
  metric: number;
  place: number;
};

export type GroupRatingSnapshot = {
  academicYearId: string;
  gradeId: string;
  rows: RatingTableRow[];
};

async function loadGroupRatingFromDb(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
): Promise<GroupRatingSnapshot> {
  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId, endsOn: null },
    select: {
      pupil: {
        select: { id: true, lastName: true, firstName: true, middleName: true },
      },
    },
  });

  const aggregates = await db.homeworkCheck.groupBy({
    by: ["pupilId"],
    where: {
      homeworkChecked: true,
      pointsTotal: { not: null },
      lesson: { academicYearId, gradeId },
    },
    _sum: { pointsTotal: true },
  });

  const pointsByPupil = new Map(
    aggregates.map((row) => [row.pupilId, row._sum.pointsTotal ?? 0]),
  );

  const ranked = rankRatingRows(
    enrollments.map((row) => ({
      pupilId: row.pupil.id,
      metric: computeRatingMetric(
        pointsByPupil.has(row.pupil.id) ? [pointsByPupil.get(row.pupil.id)!] : [],
      ),
    })),
  );

  const nameById = new Map(
    enrollments.map((row) => [row.pupil.id, formatDisplayName(row.pupil)]),
  );

  const rows: RatingTableRow[] = ranked.map((row, index) => ({
    pupilId: row.pupilId,
    displayName: nameById.get(row.pupilId) ?? "",
    metric: row.metric,
    place: index + 1,
  }));

  return { academicYearId, gradeId, rows };
}

async function loadCachedGroupRating(
  gradeId: string,
  academicYearId: string,
): Promise<GroupRatingSnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsGroup(gradeId, academicYearId));
  cacheLife("minutes");
  const db = await getPrisma();
  return loadGroupRatingFromDb(db, gradeId, academicYearId);
}

export async function getGroupRating(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
  academicYearId: string,
): Promise<MutationResult<GroupRatingSnapshot>> {
  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationIdForAnalytics(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;
    const scope = await assertAnalyticsGradeAccess(
      tx,
      actorUserId,
      organizationId,
      gradeId,
      academicYearId,
    );
    if (scope) return scope;
    return { ok: true as const };
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedGroupRating(gradeId, academicYearId);
  return { ok: true, data };
}
