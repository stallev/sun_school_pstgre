import "server-only";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export const FEATURES_PARENTS_KEY = "features.parents";

export async function readFeaturesParentsEnabled(tx: Tx): Promise<boolean> {
  const row = await tx.appSetting.findUnique({ where: { key: FEATURES_PARENTS_KEY } });
  if (!row) return false;
  return row.value === true;
}
