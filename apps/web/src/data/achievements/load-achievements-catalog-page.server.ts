import "server-only";

import { ACHIEVEMENT_KIND, PENALTY_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import type { CatalogRowDto } from "@/lib/achievements/catalog-display";

export type AchievementsCatalogPageData = {
  rewards: CatalogRowDto[];
  penalties: CatalogRowDto[];
};

async function loadKindLocked(
  tx: PrismaClient,
  achievementId: string,
): Promise<boolean> {
  const [awardCount, penaltyCount] = await Promise.all([
    tx.achievementAward.count({ where: { achievementId } }),
    tx.penalty.count({ where: { achievementId } }),
  ]);
  return awardCount + penaltyCount > 0;
}

export async function loadAchievementsCatalogPage(
  db: PrismaClient,
): Promise<AchievementsCatalogPageData> {
  const rows = await db.achievement.findMany({
    orderBy: [{ kind: "asc" }, { nameRu: "asc" }],
    include: { tiers: { orderBy: { tier: "asc" } } },
  });

  const penaltyIds = rows.filter((r) => r.kind === ACHIEVEMENT_KIND.PENALTY).map((r) => r.id);
  const activeCounts =
    penaltyIds.length === 0
      ? new Map<string, number>()
      : new Map(
          (
            await db.penalty.groupBy({
              by: ["achievementId"],
              where: { achievementId: { in: penaltyIds }, status: PENALTY_STATUS.ACTIVE },
              _count: { _all: true },
            })
          ).map((row) => [row.achievementId, row._count._all]),
        );

  const lockedById = new Map<string, boolean>();
  for (const row of rows) {
    lockedById.set(row.id, await loadKindLocked(db, row.id));
  }

  const mapRow = (row: (typeof rows)[number]): CatalogRowDto => ({
    id: row.id,
    code: row.code,
    kind: row.kind,
    nameRu: row.nameRu,
    nameEn: row.nameEn,
    descriptionRu: row.descriptionRu,
    descriptionEn: row.descriptionEn,
    category: row.category,
    ruleType: row.ruleType,
    metric: row.metric,
    threshold: row.threshold,
    isActive: row.isActive,
    tiers: row.tiers.map((tier) => ({
      tier: tier.tier,
      length: tier.length,
      points: tier.points,
    })),
    activePenaltyCount: activeCounts.get(row.id) ?? 0,
    kindLocked: lockedById.get(row.id) ?? false,
  });

  return {
    rewards: rows.filter((r) => r.kind === ACHIEVEMENT_KIND.REWARD).map(mapRow),
    penalties: rows.filter((r) => r.kind === ACHIEVEMENT_KIND.PENALTY).map(mapRow),
  };
}
