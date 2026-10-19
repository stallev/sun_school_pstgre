import { ANALYTICS_SNAPSHOT_REASON, AUDIT_SOURCE } from "@sunschool/domain";
import type { PrismaClient } from "../generated/prisma/client";
import { createYearSnapshots, type CreateYearSnapshotsResult } from "./create-year-snapshots";

export async function ensureYearSnapshots(
  db: PrismaClient,
  yearId: string,
  options?: { skipCacheRevalidation?: boolean },
): Promise<CreateYearSnapshotsResult> {
  void options?.skipCacheRevalidation;

  const year = await db.academicYear.findUnique({
    where: { id: yearId },
    select: { organizationId: true },
  });
  if (!year) {
    throw new Error("ensureYearSnapshots: academic year not found");
  }

  return db.$transaction(async (tx) =>
    createYearSnapshots(tx, yearId, ANALYTICS_SNAPSHOT_REASON.BACKFILL, {
      actorUserId: null,
      auditSource: AUDIT_SOURCE.SYSTEM,
      writeAuditEntry: true,
      skipExisting: true,
    }),
  );
}
