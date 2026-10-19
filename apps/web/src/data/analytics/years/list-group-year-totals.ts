import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  ACADEMIC_YEAR_STATUS,
  ANALYTICS_METHODOLOGY_VERSION,
  MUTATION_ERROR_CODES,
  computeYearDiff,
  type AcademicYearStatus,
  type GroupYearTotals,
  type MutationResult,
  type YearMetricDiff,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isMutationErr } from "../../access/access-admin-guards.server";
import { loadActorOrganizationIdForAnalytics } from "../analytics-shared.server";
import {
  assertGroupYearViewAccess,
  loadVisibleGroupYears,
  resolveYearSelection,
} from "./year-analytics-access.server";
import { computeGroupYearSnapshotMetrics } from "./compute-year-snapshots.server";
import { isoFromCalendarDate } from "../../school/calendar-date";
import { groupSnapshotRowToTotals } from "./year-snapshot-read.server";

export type GroupYearTotalRow = {
  yearId: string;
  yearName: string;
  status: AcademicYearStatus;
  methodologyVersion: string;
  totals: GroupYearTotals | null;
  diff: YearMetricDiff | null;
  snapshotMissing: boolean;
};

export type ListGroupYearTotalsData = {
  gradeId: string;
  selectedYearId: string;
  rows: GroupYearTotalRow[];
};

type YearMeta = {
  id: string;
  name: string;
  status: AcademicYearStatus;
  startsOn: string;
};

async function loadCachedGroupYearRows(
  db: PrismaClient,
  gradeId: string,
  years: YearMeta[],
): Promise<Omit<GroupYearTotalRow, "diff">[]> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsYears(gradeId));
  cacheLife("minutes");

  const rows: Omit<GroupYearTotalRow, "diff">[] = [];
  for (const year of years) {
    if (year.status === ACADEMIC_YEAR_STATUS.ACTIVE) {
      const totals = await computeGroupYearSnapshotMetrics(db, gradeId, year.id);
      rows.push({
        yearId: year.id,
        yearName: year.name,
        status: year.status,
        methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
        totals,
        snapshotMissing: false,
      });
      continue;
    }

    const snapshot = await db.analyticsGroupYearSnapshot.findFirst({
      where: { gradeId, academicYearId: year.id },
      orderBy: { version: "desc" },
    });
    if (!snapshot) {
      rows.push({
        yearId: year.id,
        yearName: year.name,
        status: year.status,
        methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
        totals: null,
        snapshotMissing: true,
      });
      continue;
    }

    rows.push({
      yearId: year.id,
      yearName: year.name,
      status: year.status,
      methodologyVersion: snapshot.methodologyVersion,
      totals: groupSnapshotRowToTotals(snapshot),
      snapshotMissing: false,
    });
  }
  return rows;
}

function attachYearDiffs(
  rows: Omit<GroupYearTotalRow, "diff">[],
  startsOnByYearId: ReadonlyMap<string, string>,
): GroupYearTotalRow[] {
  const chronological = [...rows].sort((left, right) =>
    (startsOnByYearId.get(left.yearId) ?? "").localeCompare(startsOnByYearId.get(right.yearId) ?? ""),
  );
  const previousByYearId = new Map<string, GroupYearTotals | null>();
  for (const row of chronological) {
    previousByYearId.set(row.yearId, row.totals);
  }

  return rows.map((row) => {
    const index = chronological.findIndex((item) => item.yearId === row.yearId);
    const previous = index > 0 ? chronological[index - 1]?.totals ?? null : null;
    const diff =
      row.totals && previous ? computeYearDiff(row.totals, previous) : null;
    return { ...row, diff };
  });
}

export async function listGroupYearTotals(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
  yearParam?: string,
): Promise<MutationResult<ListGroupYearTotalsData>> {
  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationIdForAnalytics(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;

    const grade = await tx.grade.findFirst({
      where: { id: gradeId, organizationId },
      select: { id: true },
    });
    if (!grade) {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.NOT_FOUND,
        message: "common.errors.not_found",
      };
    }

    const visibleRefs = await loadVisibleGroupYears(tx, actorUserId, organizationId, gradeId);
    if (visibleRefs.length === 0) {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.NOT_FOUND,
        message: "common.errors.not_found",
      };
    }
    const selection = resolveYearSelection(visibleRefs, yearParam);
    if (selection.kind === "not_found") {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.NOT_FOUND,
        message: "common.errors.not_found",
      };
    }
    if (selection.kind === "none") {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.NOT_FOUND,
        message: "analytics.years.none",
      };
    }

    const yearScope = await assertGroupYearViewAccess(
      tx,
      actorUserId,
      organizationId,
      gradeId,
      selection.yearId,
    );
    if (yearScope) return yearScope;

    const yearRows = await tx.academicYear.findMany({
      where: { id: { in: visibleRefs.map((year) => year.id) } },
      select: { id: true, name: true, status: true, startsOn: true },
    });

    return {
      ok: true as const,
      selectedYearId: selection.yearId,
      years: yearRows.map((year) => ({
        id: year.id,
        name: year.name,
        status: year.status,
        startsOn: isoFromCalendarDate(year.startsOn),
      })),
    };
  });

  if (isMutationErr(access)) return access;

  const body = await loadCachedGroupYearRows(db, gradeId, access.years);
  const selectedRow = body.find((row) => row.yearId === access.selectedYearId);
  if (selectedRow?.snapshotMissing) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ANALYTICS_SNAPSHOT_MISSING,
      message: "analytics.years.snapshot_missing",
    };
  }

  const startsOnByYearId = new Map(access.years.map((year) => [year.id, year.startsOn]));

  return {
    ok: true,
    data: {
      gradeId,
      selectedYearId: access.selectedYearId,
      rows: attachYearDiffs(body, startsOnByYearId),
    },
  };
}
