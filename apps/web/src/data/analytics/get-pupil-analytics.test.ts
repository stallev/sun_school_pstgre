import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { getPupilAnalytics } from "./get-pupil-analytics";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

const orgId = "22222222-2222-4222-8222-222222222222";
const actorTeacherId = "33333333-3333-4333-8333-333333333333";
const pupilId = "88888888-8888-4888-8888-888888888888";
const gradeId = "44444444-4444-4444-8444-444444444444";
const yearId = "55555555-5555-4555-8555-555555555555";
const period = { mode: "year" as const, academicYearId: yearId };

function baseTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
    },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    pupil: {
      findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
    },
    enrollment: {
      findMany: vi.fn().mockResolvedValue([{ gradeId }]),
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
      findUnique: vi.fn().mockResolvedValue(null),
    },
    ...overrides,
  };
}

describe("getPupilAnalytics (AZ-45)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_FOUND when teacher has no assignment for pupil groups", async () => {
    const tx = baseTx();
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await getPupilAnalytics(
      db as never,
      actorTeacherId,
      pupilId,
      gradeId,
      period,
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });
});
