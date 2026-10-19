import {
  ANALYTICS_METHODOLOGY_VERSION,
  ANALYTICS_SNAPSHOT_REASON,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  type AnalyticsSnapshotReason,
  type AuditSource,
} from "@sunschool/domain";
import { writeAudit } from "../audit/write-audit";
import type { Prisma } from "../generated/prisma/client";
import {
  computeGroupYearSnapshotMetrics,
  computePupilYearSnapshotMetrics,
  metricsToGroupSnapshotRow,
  metricsToPupilSnapshotRow,
} from "./compute-year-snapshots";

type Tx = Prisma.TransactionClient;

export type YearSnapshotCacheTargets = {
  gradeIds: string[];
  pupilIds: string[];
};

export type CreateYearSnapshotsResult = YearSnapshotCacheTargets & {
  groupsCreated: number;
  pupilsCreated: number;
};

export async function createYearSnapshots(
  tx: Tx,
  yearId: string,
  reason: AnalyticsSnapshotReason,
  options: {
    actorUserId: string | null;
    auditSource: AuditSource;
    writeAuditEntry: boolean;
    skipExisting?: boolean;
  },
): Promise<CreateYearSnapshotsResult> {
  const methodologyVersion = ANALYTICS_METHODOLOGY_VERSION;

  const gradeSettings = await tx.gradeSettings.findMany({
    where: { academicYearId: yearId },
    select: { gradeId: true },
  });

  const enrollments = await tx.enrollment.findMany({
    where: { academicYearId: yearId },
    select: { pupilId: true },
    distinct: ["pupilId"],
  });

  const gradeIds: string[] = [];
  const pupilIds: string[] = [];
  let groupsCreated = 0;
  let pupilsCreated = 0;

  for (const row of gradeSettings) {
    if (options.skipExisting) {
      const exists = await tx.analyticsGroupYearSnapshot.findFirst({
        where: { gradeId: row.gradeId, academicYearId: yearId, version: 1 },
        select: { version: true },
      });
      if (exists) continue;
    }

    const totals = await computeGroupYearSnapshotMetrics(tx, row.gradeId, yearId);
    await tx.analyticsGroupYearSnapshot.create({
      data: {
        ...metricsToGroupSnapshotRow(totals, methodologyVersion, reason),
        gradeId: row.gradeId,
        academicYearId: yearId,
      },
    });
    gradeIds.push(row.gradeId);
    groupsCreated += 1;
  }

  for (const row of enrollments) {
    if (options.skipExisting) {
      const exists = await tx.analyticsPupilYearSnapshot.findFirst({
        where: { pupilId: row.pupilId, academicYearId: yearId, version: 1 },
        select: { version: true },
      });
      if (exists) continue;
    }

    const metrics = await computePupilYearSnapshotMetrics(tx, row.pupilId, yearId);
    if (!metrics) continue;

    await tx.analyticsPupilYearSnapshot.create({
      data: {
        ...metricsToPupilSnapshotRow(metrics, methodologyVersion, reason),
        pupilId: row.pupilId,
        academicYearId: yearId,
      },
    });
    pupilIds.push(row.pupilId);
    pupilsCreated += 1;
  }

  if (options.writeAuditEntry && (groupsCreated > 0 || pupilsCreated > 0)) {
    await writeAudit(tx, {
      actorUserId: options.actorUserId,
      source: options.auditSource,
      entityType: AUDIT_ENTITY_TYPE.ANALYTICS_SNAPSHOT,
      entityId: yearId,
      action: AUDIT_ACTION.ANALYTICS_SNAPSHOT_CREATED,
      newValue: {
        groups: groupsCreated,
        pupils: pupilsCreated,
        methodology: methodologyVersion,
      },
    });
  }

  return { gradeIds, pupilIds, groupsCreated, pupilsCreated };
}

export async function createYearSnapshotsOnClose(
  tx: Tx,
  yearId: string,
  actorUserId: string,
): Promise<CreateYearSnapshotsResult> {
  return createYearSnapshots(tx, yearId, ANALYTICS_SNAPSHOT_REASON.CLOSE, {
    actorUserId,
    auditSource: AUDIT_SOURCE.USER,
    writeAuditEntry: true,
    skipExisting: false,
  });
}
