import { emptyCounts, type SeedCounts, type SeedTx } from "./types";

/** seed_data_spec §6: exactly one organization; the name is a seed constant, admin edits it later. */
export const DEFAULT_ORGANIZATION_NAME = "Sunday School";

export async function ensureOrganization(tx: SeedTx): Promise<SeedCounts & { organizationId: string }> {
  const counts = emptyCounts();
  const existing = await tx.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    return { ...counts, organizationId: existing.id };
  }
  const created = await tx.organization.create({ data: { name: DEFAULT_ORGANIZATION_NAME } });
  return { created: 1, updated: 0, organizationId: created.id };
}
