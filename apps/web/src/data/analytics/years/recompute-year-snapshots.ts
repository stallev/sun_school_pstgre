import "server-only";

import {
  ANALYTICS_METHODOLOGY_VERSION,
  ANALYTICS_SNAPSHOT_REASON,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  type AnalyticsSnapshotReason,
  type GroupYearTotals,
  type PupilYearTotals,
} from "@sunschool/domain";
import { Prisma, writeAudit, type Prisma as PrismaTypes } from "@sunschool/db";
import {
  computeGroupYearSnapshotMetrics,
  computePupilYearSnapshotMetrics,
  metricsToGroupSnapshotRow,
  metricsToPupilSnapshotRow,
} from "./compute-year-snapshots.server";
import type { YearSnapshotCacheTargets } from "./create-year-snapshots";

type Tx = PrismaTypes.TransactionClient;

export type YearSnapshotRecomputeScope = {
  gradeId: string;
  pupilId: string;
};

export type RecomputeYearSnapshotsResult = YearSnapshotCacheTargets & {
  versioned: boolean;
};

type GroupSnapshotMetricsRow = {
  kids: number;
  lessons: number;
  attendance: Prisma.Decimal | null;
  verses: Prisma.Decimal | null;
  test: Prisma.Decimal | null;
  notebook: Prisma.Decimal | null;
};

type PupilSnapshotMetricsRow = {
  gradeIds: string[];
  lessons: number;
  attendance: Prisma.Decimal | null;
  verses: Prisma.Decimal | null;
  test: Prisma.Decimal | null;
  notebook: Prisma.Decimal | null;
  bricksEarned: number;
};

function metricDecimalEqual(stored: Prisma.Decimal | null, value: number | null): boolean {
  if (stored === null && value === null) return true;
  if (stored === null || value === null) return false;
  return Number(stored) === value;
}

function groupTotalsMatchRow(totals: GroupYearTotals, row: GroupSnapshotMetricsRow): boolean {
  return (
    row.kids === totals.kids &&
    row.lessons === totals.lessons &&
    metricDecimalEqual(row.attendance, totals.attendance) &&
    metricDecimalEqual(row.verses, totals.verses) &&
    metricDecimalEqual(row.test, totals.test) &&
    metricDecimalEqual(row.notebook, totals.notebook)
  );
}

function pupilMetricsMatchRow(
  metrics: PupilYearTotals & { gradeIds: string[] },
  row: PupilSnapshotMetricsRow,
): boolean {
  const gradeIdsMatch =
    row.gradeIds.length === metrics.gradeIds.length &&
    row.gradeIds.every((id, index) => id === metrics.gradeIds[index]);
  return (
    gradeIdsMatch &&
    row.lessons === metrics.lessons &&
    metricDecimalEqual(row.attendance, metrics.attendance) &&
    metricDecimalEqual(row.verses, metrics.verses) &&
    metricDecimalEqual(row.test, metrics.test) &&
    metricDecimalEqual(row.notebook, metrics.notebook) &&
    row.bricksEarned === metrics.bricksEarned
  );
}

async function loadLatestGroupSnapshot(
  tx: Tx,
  gradeId: string,
  yearId: string,
): Promise<(GroupSnapshotMetricsRow & { version: number }) | null> {
  return tx.analyticsGroupYearSnapshot.findFirst({
    where: { gradeId, academicYearId: yearId },
    orderBy: { version: "desc" },
    select: {
      version: true,
      kids: true,
      lessons: true,
      attendance: true,
      verses: true,
      test: true,
      notebook: true,
    },
  });
}

async function loadLatestPupilSnapshot(
  tx: Tx,
  pupilId: string,
  yearId: string,
): Promise<(PupilSnapshotMetricsRow & { version: number }) | null> {
  return tx.analyticsPupilYearSnapshot.findFirst({
    where: { pupilId, academicYearId: yearId },
    orderBy: { version: "desc" },
    select: {
      version: true,
      gradeIds: true,
      lessons: true,
      attendance: true,
      verses: true,
      test: true,
      notebook: true,
      bricksEarned: true,
    },
  });
}

/** analytics_year_snapshots_contract §6.2 — new version when closed-year correction changes totals. */
export async function recomputeYearSnapshots(
  tx: Tx,
  yearId: string,
  scope: YearSnapshotRecomputeScope,
  reason: AnalyticsSnapshotReason,
  options: { actorUserId: string },
): Promise<RecomputeYearSnapshotsResult> {
  const methodologyVersion = ANALYTICS_METHODOLOGY_VERSION;
  const gradeIds: string[] = [];
  const pupilIds: string[] = [];
  let versioned = false;

  const latestGroup = await loadLatestGroupSnapshot(tx, scope.gradeId, yearId);
  if (latestGroup) {
    const totals = await computeGroupYearSnapshotMetrics(tx, scope.gradeId, yearId);
    if (!groupTotalsMatchRow(totals, latestGroup)) {
      const nextVersion = latestGroup.version + 1;
      await tx.analyticsGroupYearSnapshot.create({
        data: {
          ...metricsToGroupSnapshotRow(totals, methodologyVersion, reason),
          gradeId: scope.gradeId,
          academicYearId: yearId,
          version: nextVersion,
        },
      });
      await writeAudit(tx, {
        actorUserId: options.actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.ANALYTICS_SNAPSHOT,
        entityId: yearId,
        action: AUDIT_ACTION.ANALYTICS_SNAPSHOT_VERSIONED,
        newValue: { gradeId: scope.gradeId, version: nextVersion },
      });
      gradeIds.push(scope.gradeId);
      versioned = true;
    }
  }

  const latestPupil = await loadLatestPupilSnapshot(tx, scope.pupilId, yearId);
  if (latestPupil) {
    const metrics = await computePupilYearSnapshotMetrics(tx, scope.pupilId, yearId);
    if (metrics && !pupilMetricsMatchRow(metrics, latestPupil)) {
      const nextVersion = latestPupil.version + 1;
      await tx.analyticsPupilYearSnapshot.create({
        data: {
          ...metricsToPupilSnapshotRow(metrics, methodologyVersion, reason),
          pupilId: scope.pupilId,
          academicYearId: yearId,
          version: nextVersion,
        },
      });
      await writeAudit(tx, {
        actorUserId: options.actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.ANALYTICS_SNAPSHOT,
        entityId: yearId,
        action: AUDIT_ACTION.ANALYTICS_SNAPSHOT_VERSIONED,
        newValue: { pupilId: scope.pupilId, version: nextVersion },
      });
      pupilIds.push(scope.pupilId);
      versioned = true;
    }
  }

  return { gradeIds, pupilIds, versioned };
}

export async function recomputeYearSnapshotsOnCorrection(
  tx: Tx,
  yearId: string,
  scope: YearSnapshotRecomputeScope,
  actorUserId: string,
): Promise<RecomputeYearSnapshotsResult> {
  return recomputeYearSnapshots(tx, yearId, scope, ANALYTICS_SNAPSHOT_REASON.CORRECTION, {
    actorUserId,
  });
}
