import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { loadAnalyticsPage } from "./load-analytics-page.server";

const listGroupYearTotals = vi.hoisted(() => vi.fn());
const getDefaultOrganizationId = vi.hoisted(() => vi.fn());
const userHasAdminRole = vi.hoisted(() => vi.fn());
const assertTeacherAssignedToGradeInYear = vi.hoisted(() => vi.fn());

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
vi.mock("../school/school-enrollment-shared.server", () => ({
  assertTeacherAssignedToGradeInYear,
}));
vi.mock("./years/list-group-year-totals", () => ({
  listGroupYearTotals,
}));
vi.mock("./get-group-analytics", () => ({
  getGroupAnalytics: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      kpi: {},
      charts: {},
      pupilsByLayer: {},
      sampleCounts: {},
      hasCheckedLessonsInPeriod: true,
    },
  }),
}));
vi.mock("./get-conducted-lessons", () => ({
  getConductedLessons: vi.fn().mockResolvedValue({ ok: true, data: { rows: [] } }),
}));

const orgId = "22222222-2222-4222-8222-222222222222";
const actorTeacherId = "33333333-3333-4333-8333-333333333333";
const anchorYearId = "66666666-6666-4666-8666-666666666666";
const priorYearId = "55555555-5555-4555-8555-555555555555";
const gradeId = "44444444-4444-4444-8444-444444444444";

function buildDb(teacherAssignments: { id: string; name: string }[]) {
  return {
    academicYear: {
      findFirst: vi.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
        if (where.id) {
          return Promise.resolve({
            id: where.id,
            name: "2026–2027",
            status: ACADEMIC_YEAR_STATUS.ACTIVE,
          });
        }
        return Promise.resolve({ id: anchorYearId });
      }),
    },
    teacherAssignment: {
      findMany: vi.fn().mockResolvedValue(
        teacherAssignments.map((grade) => ({ grade: { id: grade.id, name: grade.name } })),
      ),
    },
  };
}

describe("loadAnalyticsPage (AZ-48)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDefaultOrganizationId.mockResolvedValue(orgId);
    userHasAdminRole.mockResolvedValue(false);
    assertTeacherAssignedToGradeInYear.mockResolvedValue(null);
    listGroupYearTotals.mockResolvedValue({
      ok: true,
      data: { gradeId, selectedYearId: priorYearId, rows: [] },
    });
  });

  it("loads page when teacher is assigned only in a prior year", async () => {
    const db = buildDb([{ id: gradeId, name: "Старшая 2" }]);

    const result = await loadAnalyticsPage(db as never, actorTeacherId, {});

    expect(result.kind).toBe("page");
    expect(db.teacherAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: actorTeacherId,
          grade: { organizationId: orgId, isActive: true },
        },
      }),
    );
    expect(listGroupYearTotals).toHaveBeenCalledWith(db, actorTeacherId, gradeId, undefined);
  });

  it("returns unassigned when teacher has no assignments in any year", async () => {
    const db = buildDb([]);

    const result = await loadAnalyticsPage(db as never, actorTeacherId, {});

    expect(result).toEqual({ kind: "unassigned" });
    expect(listGroupYearTotals).not.toHaveBeenCalled();
  });

  it("loads page when teacher has assignment in the anchor year", async () => {
    const db = buildDb([{ id: gradeId, name: "Старшая 2" }]);

    const result = await loadAnalyticsPage(db as never, actorTeacherId, {});

    expect(result.kind).toBe("page");
    expect(listGroupYearTotals).toHaveBeenCalledWith(db, actorTeacherId, gradeId, undefined);
  });
});
