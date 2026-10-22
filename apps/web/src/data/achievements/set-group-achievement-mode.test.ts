import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { evaluatePupilInTransaction } from "./evaluate-pupil";
import { setGroupAchievementMode } from "./set-group-achievement-mode";

vi.mock("./evaluate-pupil", () => ({
  evaluatePupilInTransaction: vi.fn().mockResolvedValue({ awardIds: [] }),
}));

const orgId = "33333333-3333-4333-8333-333333333333";
const actorUserId = "55555555-5555-4555-8555-555555555555";
const gradeId = "44444444-4444-4444-8444-444444444444";
const academicYearId = "66666666-6666-4666-8666-666666666666";
const settingsId = "77777777-7777-4777-8777-777777777777";

describe("setGroupAchievementMode", () => {
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
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: false }) },
      gradeSettings: { findUnique: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementMode(db as never, actorUserId, {
      gradeId,
      academicYearId,
      enabled: true,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
      message: "admin.achievements.flag_off",
    });
    expect(tx.gradeSettings.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when teacher is not assigned to the grade (AZ-55)", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      gradeSettings: { findUnique: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementMode(db as never, actorUserId, {
      gradeId,
      academicYearId,
      enabled: true,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
    expect(tx.gradeSettings.findUnique).not.toHaveBeenCalled();
  });

  it("disabling opens an off period and sets achievements_enabled false", async () => {
    const gradeSettings = {
      findUnique: vi.fn().mockResolvedValue({ id: settingsId, achievementsEnabled: true }),
      update: vi.fn().mockResolvedValue({}),
    };
    const gradeAchievementPeriod = {
      create: vi.fn().mockResolvedValue({ id: "period-1" }),
    };
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      gradeSettings,
      gradeAchievementPeriod,
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementMode(db as never, actorUserId, {
      gradeId,
      academicYearId,
      enabled: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.achievementsEnabled).toBe(false);
    }
    expect(gradeSettings.update).toHaveBeenCalledWith({
      where: { id: settingsId },
      data: { achievementsEnabled: false },
    });
    expect(gradeAchievementPeriod.create).toHaveBeenCalled();
  });

  it("enabling from false without open period backfills closed off-period before evaluate", async () => {
    const yearStartsOn = new Date("2025-09-01T00:00:00.000Z");
    const gradeSettings = {
      findUnique: vi.fn().mockResolvedValue({ id: settingsId, achievementsEnabled: false }),
      update: vi.fn().mockResolvedValue({}),
    };
    const gradeAchievementPeriod = {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({ id: "closed-off-1" }),
    };
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      academicYear: {
        findUnique: vi.fn().mockResolvedValue({ startsOn: yearStartsOn }),
      },
      gradeSettings,
      gradeAchievementPeriod,
      enrollment: { findMany: vi.fn().mockResolvedValue([{ pupilId: "pupil-1" }]) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await setGroupAchievementMode(db as never, actorUserId, {
      gradeId,
      academicYearId,
      enabled: true,
    });

    expect(result.ok).toBe(true);
    expect(gradeAchievementPeriod.updateMany).toHaveBeenCalled();
    expect(gradeAchievementPeriod.create).toHaveBeenCalledWith({
      data: {
        gradeSettingsId: settingsId,
        startsAt: yearStartsOn,
        endsAt: expect.any(Date),
      },
    });
    expect(gradeSettings.update).toHaveBeenCalledWith({
      where: { id: settingsId },
      data: { achievementsEnabled: true },
    });
    expect(evaluatePupilInTransaction).toHaveBeenCalled();
  });
});
