import "server-only";

import { ensureYearSnapshots as ensureYearSnapshotsCore, type CreateYearSnapshotsResult } from "@sunschool/db";
import type { PrismaClient } from "@sunschool/db";

export async function ensureYearSnapshots(
  db: PrismaClient,
  yearId: string,
  options?: { skipCacheRevalidation?: boolean },
): Promise<CreateYearSnapshotsResult> {
  const year = await db.academicYear.findUnique({
    where: { id: yearId },
    select: { organizationId: true },
  });
  if (!year) {
    throw new Error("ensureYearSnapshots: academic year not found");
  }

  const result = await ensureYearSnapshotsCore(db, yearId, options);

  if (!options?.skipCacheRevalidation) {
    const { revalidateYearSnapshotCaches } = await import("./revalidate-year-snapshot-cache");
    revalidateYearSnapshotCaches(result, {
      organizationId: year.organizationId,
      yearIds: [yearId],
    });
  }
  return result;
}
