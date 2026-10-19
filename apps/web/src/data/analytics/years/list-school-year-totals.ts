import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  ACADEMIC_YEAR_STATUS,
  ANALYTICS_METHODOLOGY_VERSION,
  MUTATION_ERROR_CODES,
  type GroupYearTotals,
  type MutationResult,
  type YearMetricDiff,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { userHasAdminRole } from "../../access/access-admin-guards.server";
import { getDefaultOrganizationId } from "../../access/get-organization-id.server";
import { computeGroupYearSnapshotMetrics } from "./compute-year-snapshots.server";
import { groupSnapshotRowToTotals } from "./year-snapshot-read.server";
import { resolveSchoolGroupYearComparison } from "./resolve-school-group-year-comparison";

export type SchoolGroupYearRow = {
  gradeId: string;
  gradeName: string;
  hadGroupInYear: boolean;
  totals: GroupYearTotals | null;
  diff: YearMetricDiff | null;
  hasPreviousYear: boolean;
  comparisonReliable: boolean;
  methodologyVersion: string;
  snapshotMissing: boolean;
};

export type ListSchoolYearTotalsData = {
  yearId: string;
  yearName: string;
  yearStatus: typeof ACADEMIC_YEAR_STATUS.ACTIVE | typeof ACADEMIC_YEAR_STATUS.CLOSED;
  rows: SchoolGroupYearRow[];
};

async function loadCachedSchoolYearRows(
  db: PrismaClient,
  organizationId: string,
  yearId: string,
  yearStatus: typeof ACADEMIC_YEAR_STATUS.ACTIVE | typeof ACADEMIC_YEAR_STATUS.CLOSED,
  grades: { id: string; name: string }[],
): Promise<
  Omit<SchoolGroupYearRow, "diff" | "hasPreviousYear" | "comparisonReliable">[]
> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsSchool(organizationId, yearId));
  cacheLife("minutes");

  const rows: Omit<
    SchoolGroupYearRow,
    "diff" | "hasPreviousYear" | "comparisonReliable"
  >[] = [];
  for (const grade of grades) {
    const hadSettings = await db.gradeSettings.findFirst({
      where: { gradeId: grade.id, academicYearId: yearId },
      select: { gradeId: true },
    });
    if (!hadSettings) {
      rows.push({
        gradeId: grade.id,
        gradeName: grade.name,
        hadGroupInYear: false,
        totals: null,
        methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
        snapshotMissing: false,
      });
      continue;
    }

    if (yearStatus === ACADEMIC_YEAR_STATUS.ACTIVE) {
      const totals = await computeGroupYearSnapshotMetrics(db, grade.id, yearId);
      rows.push({
        gradeId: grade.id,
        gradeName: grade.name,
        hadGroupInYear: true,
        totals,
        methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
        snapshotMissing: false,
      });
      continue;
    }

    const snapshot = await db.analyticsGroupYearSnapshot.findFirst({
      where: { gradeId: grade.id, academicYearId: yearId },
      orderBy: { version: "desc" },
    });
    if (!snapshot) {
      rows.push({
        gradeId: grade.id,
        gradeName: grade.name,
        hadGroupInYear: true,
        totals: null,
        methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
        snapshotMissing: true,
      });
      continue;
    }

    rows.push({
      gradeId: grade.id,
      gradeName: grade.name,
      hadGroupInYear: true,
      totals: groupSnapshotRowToTotals(snapshot),
      methodologyVersion: snapshot.methodologyVersion,
      snapshotMissing: false,
    });
  }
  return rows;
}

async function attachSchoolDiffs(
  db: PrismaClient,
  organizationId: string,
  yearId: string,
  rows: Omit<SchoolGroupYearRow, "diff" | "hasPreviousYear" | "comparisonReliable">[],
): Promise<SchoolGroupYearRow[]> {
  const currentYear = await db.academicYear.findUnique({
    where: { id: yearId },
    select: { startsOn: true },
  });
  if (!currentYear) {
    return rows.map((row) => ({
      ...row,
      diff: null,
      hasPreviousYear: false,
      comparisonReliable: false,
    }));
  }

  const previousYear = await db.academicYear.findFirst({
    where: {
      organizationId,
      startsOn: { lt: currentYear.startsOn },
      status: { in: [ACADEMIC_YEAR_STATUS.ACTIVE, ACADEMIC_YEAR_STATUS.CLOSED] },
    },
    orderBy: { startsOn: "desc" },
    select: { id: true, status: true },
  });

  if (!previousYear) {
    return rows.map((row) => ({
      ...row,
      diff: null,
      hasPreviousYear: false,
      comparisonReliable: false,
    }));
  }

  return Promise.all(
    rows.map(async (row) => {
      if (!row.totals) {
        return {
          ...row,
          diff: null,
          hasPreviousYear: false,
          comparisonReliable: false,
        };
      }

      let previousTotals: GroupYearTotals | null = null;
      if (previousYear.status === ACADEMIC_YEAR_STATUS.ACTIVE) {
        previousTotals = await computeGroupYearSnapshotMetrics(db, row.gradeId, previousYear.id);
      } else {
        const snapshot = await db.analyticsGroupYearSnapshot.findFirst({
          where: { gradeId: row.gradeId, academicYearId: previousYear.id },
          orderBy: { version: "desc" },
        });
        previousTotals = snapshot ? groupSnapshotRowToTotals(snapshot) : null;
      }

      const comparison = resolveSchoolGroupYearComparison(row.totals, previousTotals);
      return {
        ...row,
        diff: comparison.diff,
        hasPreviousYear: comparison.hasPreviousYear,
        comparisonReliable: comparison.comparisonReliable,
      };
    }),
  );
}

export async function listSchoolYearTotals(
  db: PrismaClient,
  actorUserId: string,
  yearId: string,
): Promise<MutationResult<ListSchoolYearTotalsData>> {
  const isAdmin = await userHasAdminRole(db, actorUserId);
  if (!isAdmin) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    };
  }

  const organizationId = await getDefaultOrganizationId(db);
  const year = await db.academicYear.findFirst({
    where: { id: yearId, organizationId },
    select: { id: true, name: true, status: true },
  });
  if (!year) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    };
  }
  if (
    year.status !== ACADEMIC_YEAR_STATUS.ACTIVE &&
    year.status !== ACADEMIC_YEAR_STATUS.CLOSED
  ) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    };
  }

  const grades = await db.grade.findMany({
    where: { organizationId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const body = await loadCachedSchoolYearRows(
    db,
    organizationId,
    year.id,
    year.status,
    grades,
  );

  const rows = await attachSchoolDiffs(db, organizationId, year.id, body);

  if (year.status === ACADEMIC_YEAR_STATUS.CLOSED && rows.some((row) => row.snapshotMissing)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ANALYTICS_SNAPSHOT_MISSING,
      message: "analytics.years.snapshot_missing",
    };
  }

  return {
    ok: true,
    data: {
      yearId: year.id,
      yearName: year.name,
      yearStatus: year.status,
      rows,
    },
  };
}
