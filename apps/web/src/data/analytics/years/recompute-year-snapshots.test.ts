import { describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_SNAPSHOT_REASON,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
} from "@sunschool/domain";
import { Prisma } from "@sunschool/db";
import { recomputeYearSnapshots } from "./recompute-year-snapshots";

const yearId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const gradeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const pupilId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const actorUserId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const baseGroupRow = {
  version: 1,
  kids: 2,
  lessons: 4,
  attendance: new Prisma.Decimal("0.75000"),
  verses: new Prisma.Decimal("1.50"),
  test: new Prisma.Decimal("8.0"),
  notebook: new Prisma.Decimal("7.0"),
};

const basePupilRow = {
  version: 1,
  gradeIds: [gradeId],
  lessons: 4,
  attendance: new Prisma.Decimal("0.80000"),
  verses: new Prisma.Decimal("2.00"),
  test: new Prisma.Decimal("9.0"),
  notebook: new Prisma.Decimal("8.0"),
  bricksEarned: 12,
};

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return {
    ...actual,
    writeAudit: vi.fn(),
  };
});

vi.mock("./compute-year-snapshots.server", () => ({
  computeGroupYearSnapshotMetrics: vi.fn().mockResolvedValue({
    kids: 2,
    lessons: 4,
    attendance: 0.75,
    verses: 1.5,
    test: 8,
    notebook: 7,
  }),
  computePupilYearSnapshotMetrics: vi.fn().mockResolvedValue({
    gradeIds: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
    lessons: 4,
    attendance: 0.8,
    verses: 2,
    test: 9,
    notebook: 8,
    bricksEarned: 12,
  }),
  metricsToGroupSnapshotRow: vi.fn().mockReturnValue({
    kids: 2,
    lessons: 4,
    attendance: 0.75,
    verses: 1.5,
    test: 8,
    notebook: 7,
    methodologyVersion: "v1",
    reason: ANALYTICS_SNAPSHOT_REASON.CORRECTION,
    version: 1,
  }),
  metricsToPupilSnapshotRow: vi.fn().mockReturnValue({
    gradeIds: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
    lessons: 4,
    attendance: 0.8,
    verses: 2,
    test: 9,
    notebook: 8,
    bricksEarned: 12,
    methodologyVersion: "v1",
    reason: ANALYTICS_SNAPSHOT_REASON.CORRECTION,
    version: 1,
  }),
}));

describe("recomputeYearSnapshots (§6.2)", () => {
  it("does not create a version when totals are unchanged", async () => {
    const tx = {
      analyticsGroupYearSnapshot: {
        findFirst: vi.fn().mockResolvedValue(baseGroupRow),
        create: vi.fn(),
      },
      analyticsPupilYearSnapshot: {
        findFirst: vi.fn().mockResolvedValue(basePupilRow),
        create: vi.fn(),
      },
    };

    const result = await recomputeYearSnapshots(
      tx as never,
      yearId,
      { gradeId, pupilId },
      ANALYTICS_SNAPSHOT_REASON.CORRECTION,
      { actorUserId },
    );

    expect(result.versioned).toBe(false);
    expect(tx.analyticsGroupYearSnapshot.create).not.toHaveBeenCalled();
    expect(tx.analyticsPupilYearSnapshot.create).not.toHaveBeenCalled();
  });

  it("creates version n+1 and audit when group totals change", async () => {
    const { writeAudit } = await import("@sunschool/db");
    const { computeGroupYearSnapshotMetrics } = await import("./compute-year-snapshots.server");
    vi.mocked(computeGroupYearSnapshotMetrics).mockResolvedValueOnce({
      kids: 3,
      lessons: 4,
      attendance: 0.75,
      verses: 1.5,
      test: 8,
      notebook: 7,
    });

    const tx = {
      analyticsGroupYearSnapshot: {
        findFirst: vi.fn().mockResolvedValue(baseGroupRow),
        create: vi.fn().mockResolvedValue({}),
      },
      analyticsPupilYearSnapshot: {
        findFirst: vi.fn().mockResolvedValue(basePupilRow),
        create: vi.fn(),
      },
    };

    const result = await recomputeYearSnapshots(
      tx as never,
      yearId,
      { gradeId, pupilId },
      ANALYTICS_SNAPSHOT_REASON.CORRECTION,
      { actorUserId },
    );

    expect(result.versioned).toBe(true);
    expect(tx.analyticsGroupYearSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 2, gradeId, academicYearId: yearId }),
      }),
    );
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.ANALYTICS_SNAPSHOT_VERSIONED,
        entityType: AUDIT_ENTITY_TYPE.ANALYTICS_SNAPSHOT,
        newValue: { gradeId, version: 2 },
      }),
    );
    expect(writeAudit).not.toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        newValue: expect.objectContaining({ pupilId }),
      }),
    );
  });
});
