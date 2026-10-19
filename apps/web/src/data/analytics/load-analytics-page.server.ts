import "server-only";

import { ACADEMIC_YEAR_STATUS, MUTATION_ERROR_CODES, SAMPLE_LAYER } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { userHasAdminRole } from "../access/access-admin-guards.server";
import type { LessonsListGradeOption } from "../lessons/load-lessons-list-page.server";
import { getDefaultOrganizationId } from "../access/get-organization-id.server";
import { assertTeacherAssignedToGradeInYear } from "../school/school-enrollment-shared.server";
import type { AnalyticsPeriodFilter, ResolvedAnalyticsPeriod } from "./analytics-period";
import type { GroupAnalyticsSnapshot } from "./analytics-compute.server";
import { getGroupAnalytics } from "./get-group-analytics";
import { getConductedLessons, type ConductedLessonsSnapshot } from "./get-conducted-lessons";
import { getDataQuality, type DataQualitySnapshot } from "./get-data-quality";
import {
  getDeletedDataInPeriod,
  type DeletedDataInPeriodSnapshot,
} from "./get-deleted-data-in-period";
import {
  listGroupYearTotals,
  type ListGroupYearTotalsData,
} from "./years/list-group-year-totals";

export type AnalyticsPageSearchParams = {
  gradeId?: string;
  year?: string;
  mode?: string;
  month?: string;
  from?: string;
  to?: string;
};

export type AnalyticsPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | { kind: "not_found" }
  | {
      kind: "page";
      yearId: string;
      yearName: string;
      gradeId: string;
      gradeName: string;
      grades: LessonsListGradeOption[];
      isAdmin: boolean;
      periodFilter: AnalyticsPeriodFilter;
      yearTotals: ListGroupYearTotalsData;
      selectedSnapshotMissing: boolean;
      analytics: GroupAnalyticsSnapshot;
      conducted: ConductedLessonsSnapshot;
      dataQuality: DataQualitySnapshot | null;
      deletedDataInPeriod: DeletedDataInPeriodSnapshot | null;
    };

const emptyScoreAverage = { average: null, observationCount: 0 };

const emptyGroupAnalyticsSnapshot = (period: ResolvedAnalyticsPeriod): GroupAnalyticsSnapshot => ({
  period,
  hasCheckedLessonsInPeriod: false,
  sampleCounts: {
    [SAMPLE_LAYER.A]: 0,
    [SAMPLE_LAYER.B]: 0,
    [SAMPLE_LAYER.C]: 0,
    [SAMPLE_LAYER.D]: 0,
  },
  pupilsByLayer: {
    [SAMPLE_LAYER.A]: [],
    [SAMPLE_LAYER.B]: [],
    [SAMPLE_LAYER.C]: [],
    [SAMPLE_LAYER.D]: [],
  },
  kpi: {
    attendancePercent: null,
    versesAverage: emptyScoreAverage,
    testAverage: emptyScoreAverage,
    notebookAverage: emptyScoreAverage,
    layerAObservationCount: 0,
  },
  charts: {
    attendance: [],
    verses: [],
    test: [],
    notebook: [],
  },
});

async function loadGradeOptions(
  db: PrismaClient,
  actorUserId: string,
  yearId: string,
  organizationId: string,
  isAdmin: boolean,
): Promise<LessonsListGradeOption[]> {
  if (isAdmin) {
    const rows = await db.grade.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({ gradeId: row.id, name: row.name }));
  }
  const assignments = await db.teacherAssignment.findMany({
    where: {
      userId: actorUserId,
      grade: { organizationId, isActive: true },
    },
    select: { grade: { select: { id: true, name: true } } },
    orderBy: { grade: { name: "asc" } },
  });
  const byGradeId = new Map<string, LessonsListGradeOption>();
  for (const row of assignments) {
    byGradeId.set(row.grade.id, { gradeId: row.grade.id, name: row.grade.name });
  }
  return [...byGradeId.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export const buildAnalyticsPeriodFilter = (
  yearId: string,
  params: AnalyticsPageSearchParams,
): AnalyticsPeriodFilter => {
  if (params.mode === "month" && params.month) {
    return { mode: "month", academicYearId: yearId, month: params.month };
  }
  if (params.mode === "range" && params.from && params.to) {
    return { mode: "range", academicYearId: yearId, from: params.from, to: params.to };
  }
  return { mode: "year", academicYearId: yearId };
};

export async function loadAnalyticsPage(
  db: PrismaClient,
  actorUserId: string,
  params: AnalyticsPageSearchParams,
): Promise<AnalyticsPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const isAdmin = await userHasAdminRole(db, actorUserId);

  const anchorYear = await db.academicYear.findFirst({
    where: {
      organizationId,
      status: { in: [ACADEMIC_YEAR_STATUS.ACTIVE, ACADEMIC_YEAR_STATUS.CLOSED] },
    },
    orderBy: { startsOn: "desc" },
    select: { id: true },
  });
  if (!anchorYear) return { kind: "no_active_year" };

  const grades = await loadGradeOptions(db, actorUserId, anchorYear.id, organizationId, isAdmin);
  if (grades.length === 0) return { kind: "unassigned" };

  const preferredGradeId = params.gradeId ?? null;
  const gradeId =
    preferredGradeId && grades.some((g) => g.gradeId === preferredGradeId)
      ? preferredGradeId
      : grades[0]?.gradeId;
  if (!gradeId) return { kind: "unassigned" };

  if (preferredGradeId && preferredGradeId !== gradeId) {
    return { kind: "not_found" };
  }

  const yearTotalsResult = await listGroupYearTotals(db, actorUserId, gradeId, params.year);
  if (isMutationErr(yearTotalsResult)) {
    if (yearTotalsResult.code === MUTATION_ERROR_CODES.NOT_FOUND) {
      return params.year ? { kind: "not_found" } : { kind: "no_active_year" };
    }
    return { kind: "unassigned" };
  }

  const yearId = yearTotalsResult.data.selectedYearId;
  const year = await db.academicYear.findFirst({
    where: { id: yearId, organizationId },
    select: { id: true, name: true, status: true },
  });
  if (!year) return { kind: "not_found" };

  if (!isAdmin) {
    const scope = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (scope) return { kind: "unassigned" };
  }

  const periodFilter = buildAnalyticsPeriodFilter(year.id, params);
  const selectedSnapshotMissing = yearTotalsResult.data.selectedSnapshotMissing;

  if (selectedSnapshotMissing) {
    const gradeName = grades.find((g) => g.gradeId === gradeId)?.name ?? "";
    return {
      kind: "page",
      yearId: year.id,
      yearName: year.name,
      gradeId,
      gradeName,
      grades,
      isAdmin,
      periodFilter,
      yearTotals: yearTotalsResult.data,
      selectedSnapshotMissing: true,
      analytics: emptyGroupAnalyticsSnapshot({
        academicYearId: year.id,
        fromIso: "",
        toIso: "",
      }),
      conducted: {
        gradeId,
        period: { academicYearId: year.id, fromIso: "", toIso: "" },
        teachers: [],
      },
      dataQuality: null,
      deletedDataInPeriod: null,
    };
  }

  const analyticsResult = await getGroupAnalytics(db, actorUserId, gradeId, periodFilter);
  if (isMutationErr(analyticsResult)) {
    if (analyticsResult.code === MUTATION_ERROR_CODES.NOT_FOUND) {
      return { kind: "not_found" };
    }
    return { kind: "unassigned" };
  }

  const conductedResult = await getConductedLessons(db, actorUserId, gradeId, periodFilter);
  if (isMutationErr(conductedResult)) {
    return { kind: "not_found" };
  }

  let dataQuality: DataQualitySnapshot | null = null;
  let deletedDataInPeriod: DeletedDataInPeriodSnapshot | null = null;
  if (isAdmin) {
    const qualityResult = await getDataQuality(db, actorUserId, gradeId, periodFilter);
    if (!isMutationErr(qualityResult)) {
      dataQuality = qualityResult.data;
    }
    const deletedResult = await getDeletedDataInPeriod(db, actorUserId, gradeId, periodFilter);
    if (!isMutationErr(deletedResult)) {
      deletedDataInPeriod = deletedResult.data;
    }
  }

  const gradeName = grades.find((g) => g.gradeId === gradeId)?.name ?? "";

  return {
    kind: "page",
    yearId: year.id,
    yearName: year.name,
    gradeId,
    gradeName,
    grades,
    isAdmin,
    periodFilter,
    yearTotals: yearTotalsResult.data,
    selectedSnapshotMissing: false,
    analytics: analyticsResult.data,
    conducted: conductedResult.data,
    dataQuality,
    deletedDataInPeriod,
  };
}
