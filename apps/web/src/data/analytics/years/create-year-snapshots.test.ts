import { describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_SNAPSHOT_REASON,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "@sunschool/domain";
import { createYearSnapshots } from "./create-year-snapshots";

const yearId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const gradeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const pupilId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

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
    reason: "CLOSE",
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
    reason: "CLOSE",
    version: 1,
  }),
}));

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return {
    ...actual,
    writeAudit: vi.fn(),
  };
});

function buildTx(overrides?: {
  skipGroup?: boolean;
  skipPupil?: boolean;
}) {
  const groupCreate = vi.fn();
  const pupilCreate = vi.fn();
  return {
    gradeSettings: {
      findMany: vi.fn().mockResolvedValue([{ gradeId }]),
    },
    enrollment: {
      findMany: vi.fn().mockResolvedValue([{ pupilId }]),
    },
    analyticsGroupYearSnapshot: {
      findFirst: vi
        .fn()
        .mockResolvedValue(overrides?.skipGroup ? { version: 1 } : null),
      create: groupCreate,
    },
    analyticsPupilYearSnapshot: {
      findFirst: vi
        .fn()
        .mockResolvedValue(overrides?.skipPupil ? { version: 1 } : null),
      create: pupilCreate,
    },
    _groupCreate: groupCreate,
    _pupilCreate: pupilCreate,
  };
}

describe("createYearSnapshots", () => {
  it("writes group and pupil version 1 rows and audit counters", async () => {
    const tx = buildTx();
    const result = await createYearSnapshots(tx as never, yearId, ANALYTICS_SNAPSHOT_REASON.CLOSE, {
      actorUserId: "actor",
      auditSource: AUDIT_SOURCE.USER,
      writeAuditEntry: true,
    });

    expect(result.groupsCreated).toBe(1);
    expect(result.pupilsCreated).toBe(1);
    expect(tx._groupCreate).toHaveBeenCalledOnce();
    expect(tx._pupilCreate).toHaveBeenCalledOnce();
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.ANALYTICS_SNAPSHOT_CREATED,
        entityType: AUDIT_ENTITY_TYPE.ANALYTICS_SNAPSHOT,
        entityId: yearId,
        newValue: { groups: 1, pupils: 1, methodology: "v1" },
      }),
    );
  });

  it("is idempotent when skipExisting is set", async () => {
    const tx = buildTx({ skipGroup: true, skipPupil: true });
    const result = await createYearSnapshots(tx as never, yearId, ANALYTICS_SNAPSHOT_REASON.BACKFILL, {
      actorUserId: null,
      auditSource: AUDIT_SOURCE.SYSTEM,
      writeAuditEntry: true,
      skipExisting: true,
    });

    expect(result.groupsCreated).toBe(0);
    expect(result.pupilsCreated).toBe(0);
    expect(tx._groupCreate).not.toHaveBeenCalled();
    expect(tx._pupilCreate).not.toHaveBeenCalled();
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).not.toHaveBeenCalled();
  });
});
