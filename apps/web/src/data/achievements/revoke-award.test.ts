import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { revokeAward } from "./revoke-award";

const orgId = "33333333-3333-4333-8333-333333333333";
const actorUserId = "55555555-5555-4555-8555-555555555555";
const awardId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("revokeAward", () => {
  it("returns ACHIEVEMENT_FLAG_OFF when features.achievements is disabled", async () => {
    const achievementAward = {
      findFirst: vi.fn(),
      update: vi.fn(),
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
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: false }) },
      achievementAward,
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await revokeAward(db as never, actorUserId, {
      awardId,
      reason: "Ошибка выдачи",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
      message: "admin.achievements.flag_off",
    });
    expect(achievementAward.findFirst).not.toHaveBeenCalled();
    expect(achievementAward.update).not.toHaveBeenCalled();
  });
});
