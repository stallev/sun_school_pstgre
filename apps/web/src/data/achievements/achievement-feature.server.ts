import "server-only";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export const FEATURES_ACHIEVEMENTS_KEY = "features.achievements";

export async function readFeaturesAchievementsEnabled(tx: Tx): Promise<boolean> {
  const row = await tx.appSetting.findUnique({ where: { key: FEATURES_ACHIEVEMENTS_KEY } });
  if (!row) return false;
  return row.value === true;
}
