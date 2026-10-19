import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_SNAPSHOT_REASON } from "@sunschool/domain";
import { eraseChildSnapshots } from "./erase-child-snapshots";

const pupilId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const gradeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const yearId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

vi.mock("./compute-year-snapshots.server", () => ({
  computeGroupYearSnapshotMetrics: vi.fn().mockResolvedValue({
    kids: 1,
    lessons: 4,
    attendance: 0.5,
    verses: 1,
    test: 7,
    notebook: 6,
  }),
  metricsToGroupSnapshotRow: vi.fn().mockReturnValue({
    kids: 1,
    lessons: 4,
    attendance: 0.5,
    verses: 1,
    test: 7,
    notebook: 6,
    methodologyVersion: "v1",
    reason: ANALYTICS_SNAPSHOT_REASON.ERASURE,
    version: 1,
  }),
}));

describe("eraseChildSnapshots (§6.3)", () => {
  it("removes pupil snapshots and rebuilds group snapshot without the child", async () => {
    const { computeGroupYearSnapshotMetrics } = await import("./compute-year-snapshots.server");

    const tx = {
      enrollment: {
        findMany: vi.fn().mockResolvedValue([{ gradeId, academicYearId: yearId }]),
      },
      analyticsPupilYearSnapshot: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      analyticsGroupYearSnapshot: {
        findFirst: vi.fn().mockResolvedValue({ version: 2 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        create: vi.fn().mockResolvedValue({}),
      },
    };

    const result = await eraseChildSnapshots(tx as never, pupilId);

    expect(tx.analyticsPupilYearSnapshot.deleteMany).toHaveBeenCalledWith({ where: { pupilId } });
    expect(tx.analyticsGroupYearSnapshot.deleteMany).toHaveBeenCalledWith({
      where: { gradeId, academicYearId: yearId },
    });
    expect(computeGroupYearSnapshotMetrics).toHaveBeenCalledWith(tx, gradeId, yearId, {
      excludePupilId: pupilId,
    });
    expect(tx.analyticsGroupYearSnapshot.create).toHaveBeenCalled();
    expect(result.pupilIds).toEqual([pupilId]);
    expect(result.gradeIds).toEqual([gradeId]);
  });
});
