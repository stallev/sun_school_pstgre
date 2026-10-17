import { describe, expect, it, vi } from "vitest";
import { ACADEMIC_YEAR_STATUS, MUTATION_ERROR_CODES } from "@sunschool/domain";
import { activateYear } from "./activate-year";

const yearId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";

describe("activateYear", () => {
  it("returns SCHOOL_YEAR_STATUS_INVALID when year is not DRAFT", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: ACADEMIC_YEAR_STATUS.ACTIVE,
          startsOn: new Date("2026-09-01"),
          endsOn: new Date("2027-06-01"),
          organizationId: orgId,
        }),
        update: vi.fn(),
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await activateYear(db as never, actorUserId, { yearId });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_YEAR_STATUS_INVALID,
      message: "admin.year.status_invalid",
    });
    expect(tx.academicYear.update).not.toHaveBeenCalled();
  });
});
