import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  ACADEMIC_YEAR_STATUS,
  ANALYTICS_COMPARISON_MIN_LESSONS,
  ANALYTICS_METHODOLOGY_VERSION,
  USER_ROLE,
  type AcademicYearStatus,
  type MutationResult,
  type PupilYearTotals,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isMutationErr } from "../../access/access-admin-guards.server";
import { loadBricksEarnedAndIssued } from "../../bricks/bricks-shared.server";
import { loadActorOrganizationIdForAnalytics } from "../analytics-shared.server";
import { assertPupilYearsViewAccess } from "./year-analytics-access.server";
import { computePupilYearSnapshotMetrics } from "./compute-year-snapshots.server";
import { pupilSnapshotRowToTotals } from "./year-snapshot-read.server";

export type PupilYearRow = {
  yearId: string;
  yearName: string;
  status: AcademicYearStatus;
  gradeLabels: string;
  gradeIds: string[];
  hasForeignGroupForTeacher: boolean;
  totals: PupilYearTotals | null;
  bricksIssued: number;
  methodologyVersion: string;
  snapshotMissing: boolean;
  insufficientLessons: boolean;
};

export type ListPupilYearRowsData = {
  pupilId: string;
  rows: PupilYearRow[];
};

type CachedPupilYearRow = Omit<PupilYearRow, "hasForeignGroupForTeacher">;

async function loadCachedPupilYearRows(
  db: PrismaClient,
  pupilId: string,
  organizationId: string,
  yearIds: string[],
): Promise<CachedPupilYearRow[]> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsPupilYears(pupilId));
  cacheLife("minutes");

  const years = await db.academicYear.findMany({
    where: { id: { in: yearIds }, organizationId },
    select: { id: true, name: true, status: true },
    orderBy: { startsOn: "desc" },
  });

  const rows: CachedPupilYearRow[] = [];
  for (const year of years) {
    const enrollments = await db.enrollment.findMany({
      where: { pupilId, academicYearId: year.id },
      orderBy: { startsOn: "asc" },
      select: { gradeId: true, grade: { select: { name: true } } },
    });
    const gradeIds = enrollments.map((row) => row.gradeId);
    const gradeLabels =
      enrollments.length === 0
        ? "—"
        : enrollments.length === 1
          ? enrollments[0]?.grade.name ?? "—"
          : enrollments.map((row) => row.grade.name).join(" → ");

    const bricksLive = await db.$transaction((tx) =>
      loadBricksEarnedAndIssued(tx, pupilId, year.id),
    );

    if (year.status === ACADEMIC_YEAR_STATUS.ACTIVE) {
      const live = await computePupilYearSnapshotMetrics(db, pupilId, year.id);
      if (!live) continue;
      rows.push({
        yearId: year.id,
        yearName: year.name,
        status: year.status,
        gradeLabels,
        gradeIds: live.gradeIds,
        totals: {
          lessons: live.lessons,
          attendance: live.attendance,
          verses: live.verses,
          test: live.test,
          notebook: live.notebook,
          bricksEarned: live.bricksEarned,
        },
        bricksIssued: bricksLive.issued,
        methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
        snapshotMissing: false,
        insufficientLessons: live.lessons < ANALYTICS_COMPARISON_MIN_LESSONS,
      });
      continue;
    }

    const snapshot = await db.analyticsPupilYearSnapshot.findFirst({
      where: { pupilId, academicYearId: year.id },
      orderBy: { version: "desc" },
    });
    if (!snapshot) {
      rows.push({
        yearId: year.id,
        yearName: year.name,
        status: year.status,
        gradeLabels,
        gradeIds,
        totals: null,
        bricksIssued: bricksLive.issued,
        methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
        snapshotMissing: true,
        insufficientLessons: false,
      });
      continue;
    }

    const totals = pupilSnapshotRowToTotals(snapshot);
    rows.push({
      yearId: year.id,
      yearName: year.name,
      status: year.status,
      gradeLabels,
      gradeIds: snapshot.gradeIds,
      totals,
      bricksIssued: bricksLive.issued,
      methodologyVersion: snapshot.methodologyVersion,
      snapshotMissing: false,
      insufficientLessons: totals.lessons < ANALYTICS_COMPARISON_MIN_LESSONS,
    });
  }

  return rows;
}

export async function listPupilYearRows(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
): Promise<MutationResult<ListPupilYearRowsData>> {
  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationIdForAnalytics(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;

    const scope = await assertPupilYearsViewAccess(tx, actorUserId, organizationId, pupilId);
    if (scope) return scope;

    const enrollmentYears = await tx.enrollment.findMany({
      where: { pupilId, pupil: { organizationId } },
      select: { academicYearId: true },
      distinct: ["academicYearId"],
    });
    const snapshotYears = await tx.analyticsPupilYearSnapshot.findMany({
      where: { pupilId, academicYear: { organizationId } },
      select: { academicYearId: true },
      distinct: ["academicYearId"],
    });

    const yearIds = [
      ...new Set([
        ...enrollmentYears.map((row) => row.academicYearId),
        ...snapshotYears.map((row) => row.academicYearId),
      ]),
    ];

    return { ok: true as const, organizationId, yearIds };
  });

  if (isMutationErr(access)) return access;

  const cachedRows = await loadCachedPupilYearRows(db, pupilId, access.organizationId, access.yearIds);

  const isAdmin = await db.userRoleAssignment.findFirst({
    where: { userId: actorUserId, role: USER_ROLE.ADMIN },
    select: { id: true },
  });

  const rows: PupilYearRow[] = [];
  for (const row of cachedRows) {
    let hasForeignGroupForTeacher = false;
    if (!isAdmin && row.gradeIds.length > 0) {
      const assignments = await db.teacherAssignment.findMany({
        where: {
          userId: actorUserId,
          academicYearId: row.yearId,
          gradeId: { in: row.gradeIds },
        },
        select: { gradeId: true },
      });
      const assigned = new Set(assignments.map((item) => item.gradeId));
      hasForeignGroupForTeacher = row.gradeIds.some((gradeId) => !assigned.has(gradeId));
    }
    rows.push({ ...row, hasForeignGroupForTeacher });
  }

  return { ok: true, data: { pupilId, rows } };
}
