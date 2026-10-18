import "server-only";

import { ACADEMIC_YEAR_STATUS, MUTATION_ERROR_CODES } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { userHasAdminRole } from "../access/access-admin-guards.server";
import type { LessonsListGradeOption } from "../lessons/load-lessons-list-page.server";
import { getDefaultOrganizationId } from "../access/get-organization-id.server";
import { assertTeacherAssignedToGradeInYear } from "../school/school-enrollment-shared.server";
import type { AnalyticsPeriodFilter } from "./analytics-period";
import type { GroupAnalyticsSnapshot } from "./analytics-compute.server";
import { getGroupAnalytics } from "./get-group-analytics";
import { getConductedLessons, type ConductedLessonsSnapshot } from "./get-conducted-lessons";
import { getDataQuality, type DataQualitySnapshot } from "./get-data-quality";

export type AnalyticsPageSearchParams = {
  gradeId?: string;
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
      analytics: GroupAnalyticsSnapshot;
      conducted: ConductedLessonsSnapshot;
      dataQuality: DataQualitySnapshot | null;
    };

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
    where: { userId: actorUserId, academicYearId: yearId },
    select: { grade: { select: { id: true, name: true } } },
    orderBy: { grade: { name: "asc" } },
  });
  return assignments.map((row) => ({ gradeId: row.grade.id, name: row.grade.name }));
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
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true },
  });
  if (!year) return { kind: "no_active_year" };

  const grades = await loadGradeOptions(db, actorUserId, year.id, organizationId, isAdmin);
  if (grades.length === 0) return { kind: "unassigned" };

  const preferredGradeId = params.gradeId ?? null;
  const gradeId =
    preferredGradeId && grades.some((g) => g.gradeId === preferredGradeId)
      ? preferredGradeId
      : grades[0]?.gradeId;
  if (!gradeId) return { kind: "unassigned" };

  if (!isAdmin) {
    const scope = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (scope) return { kind: "unassigned" };
  }

  if (preferredGradeId && preferredGradeId !== gradeId) {
    return { kind: "not_found" };
  }

  const periodFilter = buildAnalyticsPeriodFilter(year.id, params);
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
  if (isAdmin) {
    const qualityResult = await getDataQuality(db, actorUserId, gradeId, periodFilter);
    if (!isMutationErr(qualityResult)) {
      dataQuality = qualityResult.data;
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
    analytics: analyticsResult.data,
    conducted: conductedResult.data,
    dataQuality,
  };
}
