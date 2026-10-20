import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { loadSchoolAnalyticsPage } from "./load-school-analytics-page.server";

const getDefaultOrganizationId = vi.hoisted(() => vi.fn());
const userHasAdminRole = vi.hoisted(() => vi.fn());
const loadSchoolYearStrip = vi.hoisted(() => vi.fn());
const listSchoolYearTotals = vi.hoisted(() => vi.fn());
const loadSchoolDashboardCounts = vi.hoisted(() => vi.fn());

vi.mock("@/data/access/get-organization-id.server", () => ({
  getDefaultOrganizationId,
}));
vi.mock("../access/access-admin-guards.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../access/access-admin-guards.server")>();
  return {
    ...actual,
    userHasAdminRole,
  };
});
vi.mock("./years/resolve-default-year.server", () => ({
  loadSchoolYearStrip,
}));
vi.mock("./years/list-school-year-totals", () => ({
  listSchoolYearTotals,
}));
vi.mock("../school/load-school-dashboard.server", () => ({
  loadSchoolDashboardCounts,
}));
vi.mock("./analytics-shared.server", () => ({
  resolveAnalyticsPeriodForOrganization: vi.fn().mockResolvedValue({ ok: true, data: {} }),
}));
vi.mock("./analytics-compute.server", () => ({
  computeGroupAnalyticsSnapshot: vi.fn().mockResolvedValue({
    kpi: {
      versesAverage: { observationCount: 0, average: null },
      testAverage: { observationCount: 0, average: null },
      notebookAverage: { observationCount: 0, average: null },
      attendancePercent: null,
    },
    sampleCounts: { A: 0, B: 0, C: 0, D: 0 },
    charts: { attendance: [] },
  }),
}));
vi.mock("../bricks/bricks-shared.server", () => ({
  loadBricksEarnedAndIssued: vi.fn().mockResolvedValue({ earned: 0, issued: 0 }),
}));

const orgId = "22222222-2222-4222-8222-222222222222";
const actorAdminId = "33333333-3333-4333-8333-333333333333";
const activeYearId = "44444444-4444-4444-8444-444444444444";
const closedYearId = "55555555-5555-4555-8555-555555555555";

describe("loadSchoolAnalyticsPage attention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDefaultOrganizationId.mockResolvedValue(orgId);
    userHasAdminRole.mockResolvedValue(true);
    loadSchoolDashboardCounts.mockResolvedValue({ pendingRequests: 0 });
    listSchoolYearTotals.mockResolvedValue({ ok: true, data: { rows: [] } });
    loadSchoolYearStrip.mockResolvedValue([
      {
        id: closedYearId,
        name: "2024–2025",
        status: ACADEMIC_YEAR_STATUS.CLOSED,
        startsOn: "2024-09-01",
      },
      {
        id: activeYearId,
        name: "2025–2026",
        status: ACADEMIC_YEAR_STATUS.ACTIVE,
        startsOn: "2025-09-01",
      },
    ]);
  });

  it("counts negative bricks for the active year when a closed year is selected", async () => {
    const enrollmentFindMany = vi.fn().mockResolvedValue([]);
    const academicYearFindFirst = vi
      .fn()
      .mockImplementation(({ where }: { where: { id?: string; status?: string } }) => {
        if (where.status === ACADEMIC_YEAR_STATUS.ACTIVE) {
          return Promise.resolve({ id: activeYearId });
        }
        if (where.id === closedYearId) {
          return Promise.resolve({
            id: closedYearId,
            name: "2024–2025",
            status: ACADEMIC_YEAR_STATUS.CLOSED,
          });
        }
        return Promise.resolve(null);
      });

    const db = {
      academicYear: { findFirst: academicYearFindFirst },
      grade: { findMany: vi.fn().mockResolvedValue([]) },
      enrollment: { findMany: enrollmentFindMany, count: vi.fn().mockResolvedValue(0) },
      teacherAssignment: { findMany: vi.fn().mockResolvedValue([]) },
      lesson: { findFirst: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    };

    const result = await loadSchoolAnalyticsPage(db as never, actorAdminId, {
      year: closedYearId,
    });

    expect(result.kind).toBe("page");
    expect(academicYearFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      }),
    );
    expect(enrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ academicYearId: activeYearId }),
      }),
    );
  });
});
