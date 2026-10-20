import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { ensureYearSnapshots } from "../../analytics/ensure-year-snapshots";
import type { PrismaClient } from "../../generated/prisma/client";

/** Idempotent BACKFILL for closed years after `seedDevInTx` (no Next.js cache tags). */
export async function ensureClosedYearSnapshotsAfterDevSeed(prisma: PrismaClient): Promise<void> {
  const closedYears = await prisma.academicYear.findMany({
    where: { status: ACADEMIC_YEAR_STATUS.CLOSED },
    select: { id: true },
    orderBy: { startsOn: "asc" },
  });
  if (closedYears.length === 0) return;

  for (const year of closedYears) {
    await ensureYearSnapshots(prisma, year.id, { skipCacheRevalidation: true });
  }
}
