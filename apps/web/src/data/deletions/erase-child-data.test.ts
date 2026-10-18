import { describe, expect, it, vi } from "vitest";
import { DELETION_DATA_CATEGORY, DELETION_PLAN_ACTION } from "@sunschool/domain";

const scrubAuditLogForPupilPrivileged = vi.hoisted(() => vi.fn().mockResolvedValue(2));
const deleteBrickLedgerForPupilPrivileged = vi.hoisted(() => vi.fn().mockResolvedValue(3));

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return {
    ...actual,
    scrubAuditLogForPupilPrivileged,
    deleteBrickLedgerForPupilPrivileged,
  };
});

vi.mock("./preview-plan", () => ({
  gatherChildPlanInput: vi.fn().mockResolvedValue({
    enrollmentCount: 1,
    childDataConsentCount: 1,
    homeworkCheckCount: 2,
    homeworkVerseScoreCount: 4,
    homeworkScoreEventCount: 1,
    brickLedgerCount: 3,
    auditLogChildCount: 2,
    achievementAwardCount: 0,
    penaltyCount: 0,
    recitationAttemptCount: 0,
  }),
}));

import { eraseChildDataInTransaction } from "./erase-child-data";

const pupilId = "88888888-8888-4888-8888-888888888888";

describe("eraseChildDataInTransaction (deletion_requests §6.2)", () => {
  it("scrubs audit before deleting pupil-linked rows", async () => {
    const calls: string[] = [];
    const tx = {
      homeworkScoreEvent: {
        deleteMany: vi.fn().mockImplementation(async () => {
          calls.push("scoreEvents");
        }),
      },
      homeworkVerseScore: {
        deleteMany: vi.fn().mockImplementation(async () => {
          calls.push("verseScores");
        }),
      },
      achievementEvidence: {
        deleteMany: vi.fn().mockImplementation(async () => {
          calls.push("evidence");
        }),
      },
      homeworkCheck: {
        deleteMany: vi.fn().mockImplementation(async () => {
          calls.push("checks");
        }),
      },
      achievementAward: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      penalty: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      recitationAttempt: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      voicePhotoConsent: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      enrollment: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      childDataConsent: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      pupil: { delete: vi.fn().mockResolvedValue({}) },
    };

    scrubAuditLogForPupilPrivileged.mockImplementation(async () => {
      calls.push("scrubAudit");
      return 2;
    });
    deleteBrickLedgerForPupilPrivileged.mockImplementation(async () => {
      calls.push("bricks");
      return 3;
    });

    const result = await eraseChildDataInTransaction(tx as never, pupilId);

    expect(calls.indexOf("scrubAudit")).toBeLessThan(calls.indexOf("checks"));
    expect(calls.indexOf("scrubAudit")).toBeLessThan(calls.indexOf("bricks"));
    expect(tx.pupil.delete).toHaveBeenCalledWith({ where: { id: pupilId } });
    expect(result.plan.items).toContainEqual({
      category: DELETION_DATA_CATEGORY.PUPIL,
      action: DELETION_PLAN_ACTION.DELETE,
      count: 1,
    });
  });
});
