import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { attachPupil } from "./attach-pupil";
import { upsertFamily } from "./upsert-family";

const orgId = "33333333-3333-4333-8333-333333333333";
const actorUserId = "55555555-5555-4555-8555-555555555555";
const familyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pupilId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("family mutations", () => {
  it("returns FAMILY_FLAG_OFF when features.parents is disabled", async () => {
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
      family: { findFirst: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await upsertFamily(db as never, actorUserId, {
      familyId,
      name: "Family",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FAMILY_FLAG_OFF,
      message: "parent.flag_off",
    });
    expect(tx.family.findFirst).not.toHaveBeenCalled();
  });

  it("returns FORBIDDEN when actor is not admin", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: orgId,
          id: actorUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      family: { findFirst: vi.fn() },
      $queryRaw: vi.fn(),
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await attachPupil(db as never, actorUserId, { familyId, pupilId });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
    expect(tx.family.findFirst).not.toHaveBeenCalled();
  });
});
