import { describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { createYear } from "./create-year";

const actorUserId = "33333333-3333-4333-8333-333333333333";
const orgId = "22222222-2222-4222-8222-222222222222";

describe("createYear", () => {
  it("returns SCHOOL_YEAR_OVERLAP when dates intersect an existing year", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      academicYear: {
        findMany: vi.fn().mockResolvedValue([
          { startsOn: new Date("2026-09-01T00:00:00.000Z"), endsOn: new Date("2027-06-01T00:00:00.000Z") },
        ]),
        create: vi.fn(),
      },
      grade: { findMany: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await createYear(db as never, actorUserId, {
      name: "2027/28",
      startsOn: "2027-01-01",
      endsOn: "2027-12-31",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_YEAR_OVERLAP,
      message: "admin.year.overlap",
    });
    expect(tx.academicYear.create).not.toHaveBeenCalled();
  });
});
