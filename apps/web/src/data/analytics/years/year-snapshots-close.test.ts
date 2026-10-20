import { describe, expect, it, vi } from "vitest";
import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { closeYearInTransaction } from "../../school/close-year";

const yearId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";

vi.mock("./create-year-snapshots", () => ({
  createYearSnapshotsOnClose: vi.fn(),
}));

describe("closeYearInTransaction snapshot rollback", () => {
  it("does not persist year close when snapshot creation throws", async () => {
    const { createYearSnapshotsOnClose } = await import("./create-year-snapshots");
    vi.mocked(createYearSnapshotsOnClose).mockRejectedValueOnce(new Error("compute failed"));

    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: yearId }]),
      appUser: { findUnique: vi.fn() },
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
      enrollment: { updateMany: vi.fn() },
    };

    await expect(
      closeYearInTransaction(tx as never, actorUserId, orgId, { yearId }),
    ).rejects.toThrow("compute failed");

    expect(tx.academicYear.update).toHaveBeenCalled();
    expect(tx.enrollment.updateMany).toHaveBeenCalled();
  });
});
