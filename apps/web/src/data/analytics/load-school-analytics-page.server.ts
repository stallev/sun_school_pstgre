import "server-only";

import { ACADEMIC_YEAR_STATUS, SAMPLE_LAYER, computeBalance } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import type { LessonsListGradeOption } from "@/data/lessons/load-lessons-list-page.server";
import type { AnalyticsChartPoint } from "./analytics-compute.server";
import { computeGroupAnalyticsSnapshot } from "./analytics-compute.server";
import { buildAnalyticsPeriodFilter, type AnalyticsPageSearchParams } from "./load-analytics-page.server";
import { resolveAnalyticsPeriodForOrganization } from "./analytics-shared.server";
import { getConductedLessons, type ConductedLessonsSnapshot } from "./get-conducted-lessons";
import { isMutationErr } from "../access/access-admin-guards.server";
import { loadSchoolDashboardCounts } from "../school/load-school-dashboard.server";
import { loadBricksEarnedAndIssued } from "../bricks/bricks-shared.server";
export type SchoolGroupRow = {
  gradeId: string;
  gradeName: string;
  teacherNames: string;
  layerACount: number;
  totalPupils: number;
  attendancePercent: number | null;
  testAverage: string;
  lastLessonStatus: "ok" | "warn" | "idle";
  lastLessonLabel: string;
};

export type SchoolAttentionItem = {
  tone: "warn" | "danger";
  kind: "pending_access" | "negative_bricks";
  count: number;
  href: string;
};

export type SchoolChartSeries = {
  gradeId: string;
  gradeName: string;
  points: AnalyticsChartPoint[];
};

export type SchoolAnalyticsPageData =
  | { kind: "no_active_year" }
  | { kind: "forbidden" }
  | {
      kind: "page";
      yearId: string;
      yearName: string;
      gradeId: string;
      grades: LessonsListGradeOption[];
      periodFilter: ReturnType<typeof buildAnalyticsPeriodFilter>;
      groupRows: SchoolGroupRow[];
      chartSeries: SchoolChartSeries[];
      chartLabels: string[];
      attention: SchoolAttentionItem[];
      conducted: ConductedLessonsSnapshot;
    };

async function countNegativeBrickBalances(
  db: PrismaClient,
  organizationId: string,
  yearId: string,
): Promise<number> {
  const enrollments = await db.enrollment.findMany({
    where: { academicYearId: yearId, endsOn: null, pupil: { organizationId } },
    select: { pupilId: true },
  });
  let count = 0;
  for (const row of enrollments) {
    const totals = await db.$transaction((tx) =>
      loadBricksEarnedAndIssued(tx, row.pupilId, yearId),
    );
    if (computeBalance(totals.earned, totals.issued).balance < 0) count += 1;
  }
  return count;
}

export async function loadSchoolAnalyticsPage(
  db: PrismaClient,
  actorUserId: string,
  params: AnalyticsPageSearchParams & { gradeId?: string },
): Promise<SchoolAnalyticsPageData> {
  const isAdmin = await userHasAdminRole(db, actorUserId);
  if (!isAdmin) return { kind: "forbidden" };

  const organizationId = await getDefaultOrganizationId(db);
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true },
  });
  if (!year) return { kind: "no_active_year" };

  const grades = await db.grade.findMany({
    where: { organizationId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const gradeOptions = grades.map((g) => ({ gradeId: g.id, name: g.name }));
  const gradeId =
    params.gradeId && grades.some((g) => g.id === params.gradeId)
      ? params.gradeId
      : grades[0]?.id ?? "";

  const periodFilter = buildAnalyticsPeriodFilter(year.id, params);
  const resolvedPeriod = await resolveAnalyticsPeriodForOrganization(
    db,
    organizationId,
    periodFilter,
  );
  if (isMutationErr(resolvedPeriod)) {
    return { kind: "no_active_year" };
  }

  const groupRows: SchoolGroupRow[] = [];
  const chartSeries: SchoolChartSeries[] = [];

  for (const grade of grades.slice(0, 4)) {
    const snapshot = await computeGroupAnalyticsSnapshot(db, grade.id, resolvedPeriod);
    const assignments = await db.teacherAssignment.findMany({
      where: { gradeId: grade.id, academicYearId: year.id },
      select: { user: { select: { lastName: true, firstName: true } } },
    });
    const teacherNames = assignments
      .map((a) => `${a.user.firstName} ${a.user.lastName}`.trim())
      .join(", ");

    const testAvg = snapshot.kpi.testAverage;
    const testAverage =
      testAvg.observationCount > 0 && testAvg.average !== null
        ? testAvg.average.toFixed(1)
        : "—";

    const lastLesson = await db.lesson.findFirst({
      where: {
        gradeId: grade.id,
        academicYearId: year.id,
        checks: { some: { homeworkChecked: true } },
      },
      orderBy: { lessonDate: "desc" },
      select: {
        id: true,
        checks: {
          where: { homeworkChecked: true },
          select: { id: true },
        },
      },
    });
    const enrolled = await db.enrollment.count({
      where: { gradeId: grade.id, academicYearId: year.id, endsOn: null },
    });
    const checkedOnLast = lastLesson?.checks.length ?? 0;
    const lastLessonStatus =
      !lastLesson ? "idle" : checkedOnLast >= enrolled ? "ok" : "warn";
    const lastLessonLabel = lastLesson
      ? `${checkedOnLast}/${enrolled}`
      : "—";

    groupRows.push({
      gradeId: grade.id,
      gradeName: grade.name,
      teacherNames: teacherNames || "—",
      layerACount: snapshot.sampleCounts[SAMPLE_LAYER.A],
      totalPupils:
        snapshot.sampleCounts[SAMPLE_LAYER.A] +
        snapshot.sampleCounts[SAMPLE_LAYER.B] +
        snapshot.sampleCounts[SAMPLE_LAYER.C] +
        snapshot.sampleCounts[SAMPLE_LAYER.D],
      attendancePercent: snapshot.kpi.attendancePercent,
      testAverage,
      lastLessonStatus,
      lastLessonLabel,
    });

    chartSeries.push({
      gradeId: grade.id,
      gradeName: grade.name,
      points: snapshot.charts.attendance,
    });
  }

  const labelSet = new Set<string>();
  for (const series of chartSeries) {
    for (const point of series.points) {
      if (point.value !== null) labelSet.add(point.lessonDate);
    }
  }
  const chartLabels = [...labelSet].sort();

  const [dashboardCounts, negativeBricks] = await Promise.all([
    loadSchoolDashboardCounts(db),
    countNegativeBrickBalances(db, organizationId, year.id),
  ]);

  const attention: SchoolAttentionItem[] = [];
  if (dashboardCounts.pendingRequests > 0) {
    attention.push({
      tone: "warn",
      kind: "pending_access",
      count: dashboardCounts.pendingRequests,
      href: "/approvals",
    });
  }
  if (negativeBricks > 0) {
    attention.push({
      tone: "danger",
      kind: "negative_bricks",
      count: negativeBricks,
      href: "/bricks",
    });
  }

  const conductedResult = gradeId
    ? await getConductedLessons(db, actorUserId, gradeId, periodFilter)
    : null;
  const conducted: ConductedLessonsSnapshot =
    conductedResult && !isMutationErr(conductedResult)
      ? conductedResult.data
      : { gradeId, period: resolvedPeriod, teachers: [] };

  return {
    kind: "page",
    yearId: year.id,
    yearName: year.name,
    gradeId,
    grades: gradeOptions,
    periodFilter,
    groupRows,
    chartSeries,
    chartLabels,
    attention,
    conducted,
  };
}
