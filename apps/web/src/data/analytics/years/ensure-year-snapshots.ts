import "server-only";

import { ANALYTICS_SNAPSHOT_REASON, AUDIT_SOURCE } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { createYearSnapshots, type CreateYearSnapshotsResult } from "./create-year-snapshots";
import { revalidateYearSnapshotCaches } from "./revalidate-year-snapshot-cache";

export async function ensureYearSnapshots(
  db: PrismaClient,
  yearId: string,
): Promise<CreateYearSnapshotsResult> {
  const year = await db.academicYear.findUnique({
    where: { id: yearId },
    select: { organizationId: true },
  });
  if (!year) {
    throw new Error("ensureYearSnapshots: academic year not found");
  }

  const result = await db.$transaction(async (tx) =>
    createYearSnapshots(tx, yearId, ANALYTICS_SNAPSHOT_REASON.BACKFILL, {
      actorUserId: null,
      auditSource: AUDIT_SOURCE.SYSTEM,
      writeAuditEntry: true,
      skipExisting: true,
    }),
  );

  revalidateYearSnapshotCaches(result, {
    organizationId: year.organizationId,
    yearIds: [yearId],
  });
  return result;
}
