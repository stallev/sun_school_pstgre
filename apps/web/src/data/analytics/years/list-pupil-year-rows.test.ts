import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { listPupilYearRows } from "./list-pupil-year-rows";

const getPrisma = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/lib/db.server", () => ({
  getPrisma,
}));

vi.mock("./compute-year-snapshots.server", () => ({
  computePupilYearSnapshotMetrics: vi.fn().mockResolvedValue({
    gradeIds: ["44444444-4444-4444-8444-444444444444"],
    lessons: 6,
    attendance: 0.9,
    verses: 1.1,
    test: 8,
    notebook: 7,
    bricksEarned: 3,
  }),
}));

vi.mock("../../bricks/bricks-shared.server", () => ({
  loadBricksEarnedAndIssued: vi.fn().mockResolvedValue({ earned: 3, issued: 1 }),
}));

const actorTeacherId = "33333333-3333-4333-8333-333333333333";
const foreignPupilId = "77777777-7777-4777-8777-777777777777";

const orgId = "22222222-2222-4222-8222-222222222222";

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
    pupil: {
      findFirst: vi.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === foreignPupilId ? null : { id: where.id }),
      ),
    },
    enrollment: {
      findMany: vi.fn().mockResolvedValue([{ academicYearId: "55555555-5555-4555-8555-555555555555" }]),
    },
    analyticsPupilYearSnapshot: { findMany: vi.fn().mockResolvedValue([]) },
    teacherAssignment: {
      findFirst: vi.fn().mockResolvedValue({ id: "assign-1" }),
      findMany: vi.fn().mockResolvedValue([{ gradeId: "44444444-4444-4444-8444-444444444444" }]),
    },
    academicYear: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "55555555-5555-4555-8555-555555555555",
          name: "2025–2026",
          status: "ACTIVE",
        },
      ]),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        enrollment: {
          findMany: vi.fn().mockResolvedValue([
            {
              gradeId: "44444444-4444-4444-8444-444444444444",
              grade: { name: "Младшая" },
            },
          ]),
        },
      }),
    ),
    ...overrides,
  };
}

describe("listPupilYearRows (AZ-49)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all enrollment years for a transferred pupil", async () => {
    const year2025Id = "55555555-5555-4555-8555-555555555555";
    const year2026Id = "66666666-6666-4666-8666-666666666666";
    const year2024Id = "77777777-7777-4777-8777-777777777777";
    const pupilId = "88888888-8888-4888-8888-888888888888";
    const yearRows = [
      { id: year2024Id, name: "2024–2025", status: "CLOSED" },
      { id: year2025Id, name: "2025–2026", status: "CLOSED" },
      { id: year2026Id, name: "2026–2027", status: "ACTIVE" },
    ];

    const tx = buildTx({
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId }),
      },
      enrollment: {
        findMany: vi.fn().mockImplementation(({ select }: { select?: Record<string, boolean> }) => {
          if (select?.gradeId) {
            return Promise.resolve([
              {
                gradeId: "44444444-4444-4444-8444-444444444444",
                academicYearId: year2026Id,
              },
            ]);
          }
          return Promise.resolve([
            { academicYearId: year2024Id },
            { academicYearId: year2025Id },
            { academicYearId: year2026Id },
          ]);
        }),
      },
      analyticsPupilYearSnapshot: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
      academicYear: {
        findMany: vi.fn().mockResolvedValue(yearRows),
      },
      enrollment: {
        findMany: vi.fn().mockResolvedValue([
          {
            gradeId: "44444444-4444-4444-8444-444444444444",
            grade: { name: "Младшая" },
          },
        ]),
      },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      teacherAssignment: {
        findMany: vi.fn().mockResolvedValue([{ gradeId: "44444444-4444-4444-8444-444444444444" }]),
      },
      analyticsPupilYearSnapshot: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    getPrisma.mockResolvedValue(db);

    const result = await listPupilYearRows(db as never, actorTeacherId, pupilId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.rows).toHaveLength(3);
      expect(result.data.rows.map((row) => row.yearName).sort()).toEqual([
        "2024–2025",
        "2025–2026",
        "2026–2027",
      ]);
    }
  });

  it("returns NOT_FOUND for foreign pupil", async () => {
    const tx = buildTx({
      enrollment: { findMany: vi.fn().mockResolvedValue([]) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      teacherAssignment: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const result = await listPupilYearRows(db as never, actorTeacherId, foreignPupilId);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });
});
