import "server-only";

import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { getDefaultOrganizationId } from "../access/get-organization-id.server";
import { isoFromCalendarDate } from "../school/calendar-date";
import { formatDisplayName } from "@/lib/person/format-display-name";
import type { AnalyticsPeriodFilter } from "./analytics-period";
import { buildAnalyticsPeriodFilter, type AnalyticsPageSearchParams } from "./load-analytics-page.server";
import { buildPupilAnalyticsView, type PupilAnalyticsView } from "./pupil-analytics-present.server";
import { getPupilAnalytics, type PupilAnalyticsSnapshot } from "./get-pupil-analytics";
import { pupilYearMetricSchema, type PupilYearMetric } from "./pupil-analytics-metric";
import {
  listPupilYearRows,
  type ListPupilYearRowsData,
} from "./years/list-pupil-year-rows";
import {
  resolveBackToGroupGradeId,
  resolvePupilYearAnalyticsGrade,
} from "./years/resolve-pupil-year-grade";
import { resolveYearSelection } from "./years/year-analytics-access.server";

export type PupilAnalyticsPageSearchParams = AnalyticsPageSearchParams & {
  pupilYear?: string;
  metric?: string;
};

export type PupilAnalyticsPageData =
  | { kind: "no_active_year" }
  | { kind: "not_found" }
  | { kind: "snapshot_missing" }
  | {
      kind: "page";
      pupilId: string;
      pupilName: string;
      birthYear: number | null;
      isActive: boolean;
      gradeId: string;
      backToGroupGradeId: string | null;
      yearId: string;
      yearName: string;
      chartMetric: PupilYearMetric;
      periodFilter: AnalyticsPeriodFilter;
      pupilYearRows: ListPupilYearRowsData;
      isForeignGroupYearSnapshot: boolean;
      snapshot: PupilAnalyticsSnapshot | null;
      view: PupilAnalyticsView | null;
    };

export async function loadPupilAnalyticsPage(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
  params: PupilAnalyticsPageSearchParams,
  attendanceCheckedTemplate: string,
): Promise<PupilAnalyticsPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const metricParsed = pupilYearMetricSchema.safeParse(params.metric);
  const chartMetric = metricParsed.success ? metricParsed.data : "attendance";

  const pupilYearRowsResult = await listPupilYearRows(db, actorUserId, pupilId);
  if (isMutationErr(pupilYearRowsResult)) {
    return { kind: "not_found" };
  }

  const yearMeta = await db.academicYear.findMany({
    where: { id: { in: pupilYearRowsResult.data.rows.map((row) => row.yearId) } },
    select: { id: true, status: true, startsOn: true },
  });
  const yearRefs = yearMeta.map((row) => ({
    id: row.id,
    status: row.status,
    startsOn: isoFromCalendarDate(row.startsOn),
  }));
  const pupilYearSelection = resolveYearSelection(yearRefs, params.pupilYear);
  if (pupilYearSelection.kind === "not_found") return { kind: "not_found" };
  if (pupilYearSelection.kind === "none") return { kind: "no_active_year" };

  const selectedRow = pupilYearRowsResult.data.rows.find(
    (row) => row.yearId === pupilYearSelection.yearId,
  );
  if (selectedRow?.snapshotMissing) return { kind: "snapshot_missing" };

  const year = await db.academicYear.findFirst({
    where: { id: pupilYearSelection.yearId, organizationId },
    select: { id: true, name: true },
  });
  if (!year) return { kind: "not_found" };

  const pupil = await db.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      middleName: true,
      birthDate: true,
      isActive: true,
    },
  });
  if (!pupil) return { kind: "not_found" };

  const birthYear = pupil.birthDate ? pupil.birthDate.getUTCFullYear() : null;
  const pupilMeta = {
    birthYear,
    isActive: pupil.isActive,
  };

  const periodFilter = buildAnalyticsPeriodFilter(year.id, params);
  const enrollments = await db.enrollment.findMany({
    where: { pupilId, academicYearId: year.id },
    select: { gradeId: true },
    orderBy: { startsOn: "asc" },
  });
  const enrollmentGradeIds = enrollments.map((row) => row.gradeId);
  const yearGradeIds =
    selectedRow?.gradeIds.length ? selectedRow.gradeIds : enrollmentGradeIds;
  if (yearGradeIds.length === 0) return { kind: "not_found" };

  const isAdmin =
    (await db.userRoleAssignment.findFirst({
      where: { userId: actorUserId, role: USER_ROLE.ADMIN },
      select: { id: true },
    })) !== null;

  const teacherAssignments = isAdmin
    ? []
    : await db.teacherAssignment.findMany({
        where: {
          userId: actorUserId,
          academicYearId: year.id,
          gradeId: { in: [...yearGradeIds] },
        },
        select: { gradeId: true },
      });
  const teacherAssignedGradeIds = teacherAssignments.map((row) => row.gradeId);

  const gradeResolution = resolvePupilYearAnalyticsGrade({
    isAdmin,
    yearGradeIds,
    enrollmentGradeIdsOrdered: enrollmentGradeIds,
    teacherAssignedGradeIds,
    requestedGradeId: params.gradeId,
  });

  const teacherAssignedByYear = new Map<string, string[]>();
  if (!isAdmin) {
    const yearIds = pupilYearRowsResult.data.rows.map((row) => row.yearId);
    const allAssignments = await db.teacherAssignment.findMany({
      where: { userId: actorUserId, academicYearId: { in: yearIds } },
      select: { academicYearId: true, gradeId: true },
    });
    for (const row of pupilYearRowsResult.data.rows) {
      const gradeIdSet = new Set(row.gradeIds);
      teacherAssignedByYear.set(
        row.yearId,
        allAssignments
          .filter(
            (item) => item.academicYearId === row.yearId && gradeIdSet.has(item.gradeId),
          )
          .map((item) => item.gradeId),
      );
    }
  }
  const backToGroupGradeId = isAdmin
    ? yearGradeIds[0] ?? null
    : resolveBackToGroupGradeId(pupilYearRowsResult.data.rows, teacherAssignedByYear);

  if (gradeResolution.mode === "foreign_snapshot_only") {
    return {
      kind: "page",
      pupilId,
      pupilName: formatDisplayName(pupil),
      ...pupilMeta,
      gradeId: yearGradeIds[0]!,
      backToGroupGradeId,
      yearId: year.id,
      yearName: year.name,
      chartMetric,
      periodFilter,
      pupilYearRows: pupilYearRowsResult.data,
      isForeignGroupYearSnapshot: true,
      snapshot: null,
      view: null,
    };
  }

  const gradeId = gradeResolution.gradeId;

  const analyticsResult = await getPupilAnalytics(db, actorUserId, pupilId, gradeId, periodFilter);
  if (isMutationErr(analyticsResult)) {
    if (analyticsResult.code === MUTATION_ERROR_CODES.NOT_FOUND) {
      return { kind: "not_found" };
    }
    return { kind: "not_found" };
  }

  const view = buildPupilAnalyticsView(analyticsResult.data, attendanceCheckedTemplate);

  return {
    kind: "page",
    pupilId,
    pupilName: formatDisplayName(pupil),
    ...pupilMeta,
    gradeId,
    backToGroupGradeId,
    yearId: year.id,
    yearName: year.name,
    chartMetric,
    periodFilter,
    pupilYearRows: pupilYearRowsResult.data,
    isForeignGroupYearSnapshot: false,
    snapshot: analyticsResult.data,
    view,
  };
}
