import "server-only";

import {
  GROUP_ACHIEVEMENT_PENALTY_TIER,
  resolveEffectivePoints,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export type GroupAchievementPointsOverrideMap = Map<string, number>;

export type EffectivePointsMeta = {
  points: number;
  pointsSource: "global" | "grade";
};

function overrideKey(achievementId: string, tier: number): string {
  return `${achievementId}:${tier}`;
}

export function getGroupPointsOverride(
  overrides: GroupAchievementPointsOverrideMap,
  achievementId: string,
  tier: number,
): number | undefined {
  return overrides.get(overrideKey(achievementId, tier));
}

/** achievement_group_points_contract §6.2 — one query per group-year. */
export async function loadGroupAchievementPointsOverrides(
  tx: Tx,
  gradeId: string,
  academicYearId: string,
): Promise<GroupAchievementPointsOverrideMap> {
  const settings = await tx.gradeSettings.findUnique({
    where: { gradeId_academicYearId: { gradeId, academicYearId } },
    select: {
      achievementPoints: {
        select: { achievementId: true, tier: true, points: true },
      },
    },
  });

  const map: GroupAchievementPointsOverrideMap = new Map();
  if (!settings) return map;
  for (const row of settings.achievementPoints) {
    map.set(overrideKey(row.achievementId, row.tier), row.points);
  }
  return map;
}

/** Loads overrides for several groups in one query (evaluate across transfers). */
export async function loadGroupAchievementPointsOverridesForGrades(
  tx: Tx,
  gradeIds: readonly string[],
  academicYearId: string,
): Promise<Map<string, GroupAchievementPointsOverrideMap>> {
  const uniqueGradeIds = [...new Set(gradeIds)];
  const byGrade = new Map<string, GroupAchievementPointsOverrideMap>();
  for (const gradeId of uniqueGradeIds) {
    byGrade.set(gradeId, new Map());
  }
  if (uniqueGradeIds.length === 0) return byGrade;

  const rows = await tx.gradeAchievementPoints.findMany({
    where: {
      gradeSettings: { gradeId: { in: uniqueGradeIds }, academicYearId },
    },
    select: {
      achievementId: true,
      tier: true,
      points: true,
      gradeSettings: { select: { gradeId: true } },
    },
  });

  for (const row of rows) {
    const gradeId = row.gradeSettings.gradeId;
    let map = byGrade.get(gradeId);
    if (!map) {
      map = new Map();
      byGrade.set(gradeId, map);
    }
    map.set(overrideKey(row.achievementId, row.tier), row.points);
  }
  return byGrade;
}

export function globalCatalogPenaltyPoints(
  threshold: number | null,
  tierPoints: number | undefined,
): number | null {
  if (tierPoints !== undefined) return tierPoints;
  if (threshold !== null && threshold < 0) return threshold;
  return null;
}

export function resolveRewardTierPoints(
  globalPoints: number,
  overrides: GroupAchievementPointsOverrideMap,
  achievementId: string,
  tier: number,
): EffectivePointsMeta {
  const override = getGroupPointsOverride(overrides, achievementId, tier);
  return {
    points: resolveEffectivePoints(globalPoints, override),
    pointsSource: override === undefined ? "global" : "grade",
  };
}

export function resolvePenaltyCatalogPoints(
  threshold: number | null,
  tierPoints: number | undefined,
  overrides: GroupAchievementPointsOverrideMap,
  achievementId: string,
): EffectivePointsMeta | null {
  const global = globalCatalogPenaltyPoints(threshold, tierPoints);
  if (global === null) return null;
  const override = getGroupPointsOverride(
    overrides,
    achievementId,
    GROUP_ACHIEVEMENT_PENALTY_TIER,
  );
  return {
    points: resolveEffectivePoints(global, override),
    pointsSource: override === undefined ? "global" : "grade",
  };
}
