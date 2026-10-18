import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { getGroupAnalytics } from "./get-group-analytics";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("./analytics-compute.server", () => ({
  computeGroupAnalyticsSnapshot: vi.fn().mockResolvedValue({
    period: { academicYearId: "y", fromIso: "2025-09-01", toIso: "2026-06-30" },
    hasCheckedLessonsInPeriod: false,
    sampleCounts: { A: 0, B: 0, C: 0, D: 0 },
    pupilsByLayer: { A: [], B: [], C: [], D: [] },
    kpi: {
      attendancePercent: null,
      versesAverage: { average: null, observationCount: 0 },
      testAverage: { average: null, observationCount: 0 },
      notebookAverage: { average: null, observationCount: 0 },
      layerAObservationCount: 0,
    },
    charts: { attendance: [], verses: [], test: [], notebook: [] },
  }),
}));

const orgId = "22222222-2222-4222-8222-222222222222";
const actorTeacherId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";
const yearId = "55555555-5555-4555-8555-555555555555";
const foreignGradeId = "99999999-9999-4999-8999-999999999999";

const period = { mode: "year" as const, academicYearId: yearId };

function baseTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
    },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    grade: {
      findFirst: vi.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === foreignGradeId ? null : { id: where.id }),
      ),
    },
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: yearId,
        organizationId: orgId,
        startsOn: new Date(Date.UTC(2025, 8, 1)),
        endsOn: new Date(Date.UTC(2026, 5, 30)),
      }),
    },
    teacherAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    ...overrides,
  };
}

describe("getGroupAnalytics (AZ-45)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_FOUND for foreign group", async () => {
    const tx = baseTx({
      teacherAssignment: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await getGroupAnalytics(db as never, actorTeacherId, foreignGradeId, period);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("returns snapshot when teacher is assigned", async () => {
    const tx = baseTx();
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await getGroupAnalytics(db as never, actorTeacherId, gradeId, period);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hasCheckedLessonsInPeriod).toBe(false);
    }
  });
});
