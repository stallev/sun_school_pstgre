import { describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { recalculateAchievementsInTransaction } from "./recalculate-achievements";

describe("recalculateAchievementsInTransaction", () => {
  it("returns ACHIEVEMENT_FLAG_OFF when features.achievements is disabled", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role", role: USER_ROLE.ADMIN }),
      },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: false }) },
    };

    const result = await recalculateAchievementsInTransaction(tx as never, "admin", "org", {});
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
      message: "admin.achievements.flag_off",
    });
  });
});
