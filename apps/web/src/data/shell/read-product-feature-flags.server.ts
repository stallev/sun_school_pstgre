import "server-only";
import type { DbReader } from "@sunschool/db";
import { FEATURES_ACHIEVEMENTS_KEY } from "@/data/achievements/achievement-feature.server";
import { FEATURES_PARENTS_KEY } from "@/data/families/family-feature.server";

export type ProductFeatureFlags = {
  achievementsEnabled: boolean;
  parentsEnabled: boolean;
};

/** Single round-trip for shell nav feature toggles (ADR-019 §4 п. 4). */
export async function readProductFeatureFlags(db: DbReader): Promise<ProductFeatureFlags> {
  const rows = await db.appSetting.findMany({
    where: { key: { in: [FEATURES_ACHIEVEMENTS_KEY, FEATURES_PARENTS_KEY] } },
    select: { key: true, value: true },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value === true]));
  return {
    achievementsEnabled: byKey.get(FEATURES_ACHIEVEMENTS_KEY) ?? false,
    parentsEnabled: byKey.get(FEATURES_PARENTS_KEY) ?? false,
  };
}
