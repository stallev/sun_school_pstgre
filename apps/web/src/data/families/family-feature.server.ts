import "server-only";
import type { DbReader } from "@sunschool/db";

export const FEATURES_PARENTS_KEY = "features.parents";

export async function readFeaturesParentsEnabled(db: DbReader): Promise<boolean> {
  const row = await db.appSetting.findUnique({ where: { key: FEATURES_PARENTS_KEY } });
  if (!row) return false;
  return row.value === true;
}
