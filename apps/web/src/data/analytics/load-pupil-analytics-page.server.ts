import "server-only";

import { ACADEMIC_YEAR_STATUS, MUTATION_ERROR_CODES } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { getDefaultOrganizationId } from "../access/get-organization-id.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import type { AnalyticsPeriodFilter } from "./analytics-period";
import { buildAnalyticsPeriodFilter, type AnalyticsPageSearchParams } from "./load-analytics-page.server";
import { buildPupilAnalyticsView, type PupilAnalyticsView } from "./pupil-analytics-present.server";
import { getPupilAnalytics, type PupilAnalyticsSnapshot } from "./get-pupil-analytics";

export type PupilAnalyticsPageSearchParams = AnalyticsPageSearchParams;

export type PupilAnalyticsPageData =
  | { kind: "no_active_year" }
  | { kind: "not_found" }
  | {
      kind: "page";
      pupilId: string;
      pupilName: string;
      gradeId: string;
      yearName: string;
      periodFilter: AnalyticsPeriodFilter;
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
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true },
  });
  if (!year) return { kind: "no_active_year" };

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
    yearName: year.name,
    periodFilter,
    snapshot: analyticsResult.data,
    view,
  };
}
