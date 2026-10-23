import "server-only";

import { PENALTY_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import type { RatingTableRow } from "@/data/analytics/get-group-rating";

export async function enrichRatingRowsWithAchievements(
  db: PrismaClient,
  academicYearId: string,
  rows: RatingTableRow[],
): Promise<RatingTableRow[]> {
  if (rows.length === 0) return rows;
  const pupilIds = rows.map((row) => row.pupilId);

  const [bonusRows, awardCounts, penaltyCounts] = await Promise.all([
    db.achievementAward.groupBy({
      by: ["pupilId"],
      where: { pupilId: { in: pupilIds }, academicYearId, revokedAt: null },
      _sum: { points: true },
    }),
    db.achievementAward.groupBy({
      by: ["pupilId"],
      where: { pupilId: { in: pupilIds }, academicYearId, revokedAt: null },
      _count: { _all: true },
    }),
    db.penalty.groupBy({
      by: ["pupilId"],
      where: {
        pupilId: { in: pupilIds },
        status: PENALTY_STATUS.ACTIVE,
        lesson: { academicYearId },
      },
      _count: { _all: true },
    }),
  ]);

  const bonusByPupil = new Map(bonusRows.map((row) => [row.pupilId, row._sum.points ?? 0]));
  const awardsByPupil = new Map(awardCounts.map((row) => [row.pupilId, row._count._all]));
  const penaltiesByPupil = new Map(penaltyCounts.map((row) => [row.pupilId, row._count._all]));

  return rows.map((row) => ({
    ...row,
    achievementBonus: bonusByPupil.get(row.pupilId) ?? 0,
    awardsCount: awardsByPupil.get(row.pupilId) ?? 0,
    penaltiesCount: penaltiesByPupil.get(row.pupilId) ?? 0,
  }));
}
