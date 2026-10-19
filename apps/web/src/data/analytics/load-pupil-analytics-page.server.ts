import "server-only";

import { MUTATION_ERROR_CODES } from "@sunschool/domain";
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
      gradeId: string;
      yearId: string;
      yearName: string;
      chartMetric: PupilYearMetric;
      periodFilter: AnalyticsPeriodFilter;
      pupilYearRows: ListPupilYearRowsData;
      snapshot: PupilAnalyticsSnapshot;
      view: PupilAnalyticsView;
    };

export async function loadPupilAnalyticsPage(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
  params: PupilAnalyticsPageSearchParams,
  formatAttendanceChecked: (attended: number, checked: number) => string,
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
    select: { id: true, firstName: true, lastName: true, middleName: true },
  });
  if (!pupil) return { kind: "not_found" };

  const periodFilter = buildAnalyticsPeriodFilter(year.id, params);
  const enrollment = await db.enrollment.findFirst({
    where: { pupilId, academicYearId: year.id },
    select: { gradeId: true },
    orderBy: { startsOn: "desc" },
  });
  if (!enrollment) return { kind: "not_found" };

  const gradeId = params.gradeId ?? enrollment.gradeId;

  const analyticsResult = await getPupilAnalytics(db, actorUserId, pupilId, gradeId, periodFilter);
  if (isMutationErr(analyticsResult)) {
    if (analyticsResult.code === MUTATION_ERROR_CODES.NOT_FOUND) {
      return { kind: "not_found" };
    }
    return { kind: "not_found" };
  }

  const view = buildPupilAnalyticsView(analyticsResult.data, formatAttendanceChecked);

  return {
    kind: "page",
    pupilId,
    pupilName: formatDisplayName(pupil),
    gradeId,
    yearId: year.id,
    yearName: year.name,
    chartMetric,
    periodFilter,
    pupilYearRows: pupilYearRowsResult.data,
    snapshot: analyticsResult.data,
    view,
  };
}
