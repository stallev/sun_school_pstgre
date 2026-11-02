import "server-only";
import type { DbReader } from "@sunschool/db";

export const FEATURES_ACHIEVEMENTS_KEY = "features.achievements";

export async function readFeaturesAchievementsEnabled(db: DbReader): Promise<boolean> {
  const row = await db.appSetting.findUnique({ where: { key: FEATURES_ACHIEVEMENTS_KEY } });
  if (!row) return false;
  return row.value === true;
}
