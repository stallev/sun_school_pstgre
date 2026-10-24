import { describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { setGroupAchievementPoints } from "./set-group-achievement-points";

const orgId = "33333333-3333-4333-8333-333333333333";
const actorUserId = "55555555-5555-4555-8555-555555555555";
const gradeId = "44444444-4444-4444-8444-444444444444";
const academicYearId = "66666666-6666-4666-8666-666666666666";
const settingsId = "77777777-7777-4777-8777-777777777777";
const achievementId = "88888888-8888-4888-8888-888888888888";

describe("setGroupAchievementPoints", () => {
  it("returns ACHIEVEMENT_FLAG_OFF when features.achievements is disabled", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: academicYearId,
          status: ACADEMIC_YEAR_STATUS.ACTIVE,
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: false }) },
      $queryRaw: vi.fn(),
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementPoints(db as never, actorUserId, {
      gradeId,
      academicYearId,
      items: [{ achievementId, tier: 1, points: 5 }],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
      message: "admin.achievements.flag_off",
    });
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });

  it("returns ACHIEVEMENT_YEAR_CLOSED for teacher in a closed year", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: academicYearId,
          status: ACADEMIC_YEAR_STATUS.CLOSED,
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "assign-1" }),
      },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      $queryRaw: vi.fn(),
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementPoints(db as never, actorUserId, {
      gradeId,
      academicYearId,
      items: [{ achievementId, tier: 1, points: 5 }],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_YEAR_CLOSED,
      message: "common.errors.year_closed",
    });
  });

  it("returns NOT_FOUND when teacher is not assigned to the grade", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: academicYearId,
          status: ACADEMIC_YEAR_STATUS.ACTIVE,
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      $queryRaw: vi.fn(),
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementPoints(db as never, actorUserId, {
      gradeId,
      academicYearId,
      items: [{ achievementId, tier: 1, points: 5 }],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("returns VALIDATION without mutating when a later item is not in catalog", async () => {
    const unknownAchievementId = "99999999-9999-4999-8999-999999999999";
    const upsert = vi.fn();
    const deleteMany = vi.fn();
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: academicYearId,
          status: ACADEMIC_YEAR_STATUS.ACTIVE,
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      $queryRaw: vi.fn().mockResolvedValue([{ id: settingsId }]),
      achievement: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: achievementId,
            threshold: null,
            tiers: [{ tier: 1, points: 10 }],
          },
        ]),
      },
      gradeAchievementPoints: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany,
        upsert,
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementPoints(db as never, actorUserId, {
      gradeId,
      academicYearId,
      items: [
        { achievementId, tier: 1, points: 15 },
        { achievementId: unknownAchievementId, tier: 1, points: 5 },
      ],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "common.errors.validation",
    });
    expect(upsert).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("is idempotent without upsert when override is unchanged", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: academicYearId,
          status: ACADEMIC_YEAR_STATUS.ACTIVE,
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      $queryRaw: vi.fn().mockResolvedValue([{ id: settingsId }]),
      achievement: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: achievementId,
            threshold: null,
            tiers: [{ tier: 1, points: 10 }],
          },
        ]),
      },
      gradeAchievementPoints: {
        findMany: vi.fn().mockResolvedValue([
          { achievementId, tier: 1, points: 12 },
        ]),
        deleteMany: vi.fn(),
        upsert: vi.fn(),
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementPoints(db as never, actorUserId, {
      gradeId,
      academicYearId,
      items: [{ achievementId, tier: 1, points: 12 }],
    });

    expect(result).toEqual({ ok: true, data: { changed: 0 } });
    expect(tx.gradeAchievementPoints.upsert).not.toHaveBeenCalled();
  });
});
