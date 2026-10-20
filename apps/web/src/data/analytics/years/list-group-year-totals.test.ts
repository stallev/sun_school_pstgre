import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { listGroupYearTotals } from "./list-group-year-totals";

const getPrisma = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/lib/db.server", () => ({
  getPrisma,
}));

vi.mock("./compute-year-snapshots.server", () => ({
  computeGroupYearSnapshotMetrics: vi.fn().mockResolvedValue({
    kids: 12,
    lessons: 8,
    attendance: 0.8,
    verses: 1.2,
    test: 7.5,
    notebook: 8.1,
  }),
}));

const orgId = "22222222-2222-4222-8222-222222222222";
const actorTeacherId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";
const year2025Id = "55555555-5555-4555-8555-555555555555";
const year2026Id = "66666666-6666-4666-8666-666666666666";
const year2024Id = "77777777-7777-4777-8777-777777777777";
const foreignGradeId = "99999999-9999-4999-8999-999999999999";

const yearCatalog = [
  {
    id: year2024Id,
    name: "2024–2025",
    status: "CLOSED",
    startsOn: new Date(Date.UTC(2024, 8, 1)),
  },
  {
    id: year2025Id,
    name: "2025–2026",
    status: "CLOSED",
    startsOn: new Date(Date.UTC(2025, 8, 1)),
  },
  {
    id: year2026Id,
    name: "2026–2027",
    status: "ACTIVE",
    startsOn: new Date(Date.UTC(2026, 8, 1)),
  },
];

function buildTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({
        id: actorTeacherId,
        organizationId: orgId,
        status: "ACTIVE",
        roles: [{ role: USER_ROLE.TEACHER }],
      }),
    },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    grade: {
      findFirst: vi.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === foreignGradeId ? null : { id: where.id }),
      ),
    },
    gradeSettings: {
      findMany: vi.fn().mockResolvedValue(
        yearCatalog.map((year) => ({
          academicYear: {
            id: year.id,
            status: year.status,
            startsOn: year.startsOn,
          },
        })),
      ),
    },
    analyticsGroupYearSnapshot: { findMany: vi.fn().mockResolvedValue([]) },
    teacherAssignment: {
      findMany: vi.fn().mockResolvedValue([
        { academicYearId: year2025Id },
        { academicYearId: year2026Id },
      ]),
      findFirst: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    academicYear: {
      findMany: vi.fn().mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
        Promise.resolve(yearCatalog.filter((year) => where.id.in.includes(year.id))),
      ),
    },
    ...overrides,
  };
}

describe("listGroupYearTotals (AZ-48)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_FOUND for foreign group", async () => {
    const tx = buildTx({
      teacherAssignment: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await listGroupYearTotals(db as never, actorTeacherId, foreignGradeId);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("returns two visible years for teacher assigned in 2025–2026 and 2026–2027", async () => {
    const tx = buildTx();
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
      analyticsGroupYearSnapshot: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    getPrisma.mockResolvedValue(db);

    const result = await listGroupYearTotals(db as never, actorTeacherId, gradeId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.selectedYearId).toBe(year2026Id);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.selectedSnapshotMissing).toBe(false);
      expect(result.data.rows.map((row) => row.yearName).sort()).toEqual([
        "2025–2026",
        "2026–2027",
      ]);
    }
  });

  it("returns rows and selectedSnapshotMissing when selected closed year lacks snapshot", async () => {
    const tx = buildTx();
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
      analyticsGroupYearSnapshot: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    getPrisma.mockResolvedValue(db);

    const result = await listGroupYearTotals(db as never, actorTeacherId, gradeId, year2025Id);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.selectedYearId).toBe(year2025Id);
      expect(result.data.selectedSnapshotMissing).toBe(true);
      expect(result.data.rows.some((row) => row.snapshotMissing)).toBe(true);
    }
  });

  it("returns three visible years for admin", async () => {
    const tx = buildTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: actorTeacherId,
          organizationId: orgId,
          status: "ACTIVE",
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue({ id: "admin-role" }) },
      teacherAssignment: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
      analyticsGroupYearSnapshot: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    getPrisma.mockResolvedValue(db);

    const result = await listGroupYearTotals(db as never, actorTeacherId, gradeId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.rows).toHaveLength(3);
    }
  });
});
