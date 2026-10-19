import "server-only";

import { ANALYTICS_METHODOLOGY_VERSION, ANALYTICS_SNAPSHOT_REASON } from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import {
  computeGroupYearSnapshotMetrics,
  metricsToGroupSnapshotRow,
} from "./compute-year-snapshots.server";
import type { YearSnapshotCacheTargets } from "./create-year-snapshots";

type Tx = Prisma.TransactionClient;

type GradeYearPair = {
  gradeId: string;
  academicYearId: string;
};

function uniqueGradeYearPairs(rows: GradeYearPair[]): GradeYearPair[] {
  const seen = new Set<string>();
  const out: GradeYearPair[] = [];
  for (const row of rows) {
    const key = `${row.gradeId}:${row.academicYearId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** analytics_year_snapshots_contract §6.3 — before homework_check deletion (deletion_requests §6.2). */
export async function eraseChildSnapshots(tx: Tx, pupilId: string): Promise<YearSnapshotCacheTargets> {
  const enrollments = await tx.enrollment.findMany({
    where: { pupilId },
    select: { gradeId: true, academicYearId: true },
  });
  const pairs = uniqueGradeYearPairs(enrollments);

  await tx.analyticsPupilYearSnapshot.deleteMany({ where: { pupilId } });

  const gradeIds: string[] = [];
  const methodologyVersion = ANALYTICS_METHODOLOGY_VERSION;

  for (const { gradeId, academicYearId } of pairs) {
    const hadGroupSnapshot = await tx.analyticsGroupYearSnapshot.findFirst({
      where: { gradeId, academicYearId },
      select: { version: true },
    });
    if (!hadGroupSnapshot) continue;

    await tx.analyticsGroupYearSnapshot.deleteMany({
      where: { gradeId, academicYearId },
    });

    const totals = await computeGroupYearSnapshotMetrics(tx, gradeId, academicYearId, {
      excludePupilId: pupilId,
    });

    await tx.analyticsGroupYearSnapshot.create({
      data: {
        ...metricsToGroupSnapshotRow(totals, methodologyVersion, ANALYTICS_SNAPSHOT_REASON.ERASURE),
        gradeId,
        academicYearId,
      },
    });
    gradeIds.push(gradeId);
  }

  return { gradeIds, pupilIds: [pupilId] };
}
