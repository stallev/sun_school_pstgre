import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_STATUS, MUTATION_ERROR_CODES } from "@sunschool/domain";

const scrubAuditLogForUserPrivileged = vi.hoisted(() => vi.fn().mockResolvedValue(2));
const reassignAuditActorsForUserMerge = vi.hoisted(() => vi.fn());

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return {
    ...actual,
    writeAudit: vi.fn(),
    scrubAuditLogForUserPrivileged,
    reassignAuditActorsForUserMerge,
  };
});

vi.mock("../deletions/anonymize-user", () => ({
  anonymizeUserInTransaction: vi.fn().mockResolvedValue({ deletedOrdinal: 2 }),
}));

import { anonymizeUserInTransaction } from "../deletions/anonymize-user";
import { mergeUsers } from "./merge-users";

const actorUserId = "33333333-3333-4333-8333-333333333333";
const keepUserId = "44444444-4444-4444-8444-444444444444";
const mergeUserId = "55555555-5555-4555-8555-555555555555";
const orgId = "22222222-2222-4222-8222-222222222222";

describe("mergeUsers (access_requests §5.9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("anonymizes the duplicate via shared deletion DAL", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([
        { id: keepUserId, status: ACCOUNT_STATUS.ACTIVE, organizationId: orgId },
        { id: mergeUserId, status: ACCOUNT_STATUS.ACTIVE, organizationId: orgId },
      ]),
      loginIdentity: { findMany: vi.fn().mockResolvedValue([]) },
      userRoleAssignment: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
      teacherAssignment: { findMany: vi.fn().mockResolvedValue([]) },
      lesson: { updateMany: vi.fn() },
      homeworkCheck: { updateMany: vi.fn() },
      brickLedger: { updateMany: vi.fn() },
    };

    const db = {
      $transaction: vi.fn(async (fn: (inner: unknown) => Promise<unknown>) => fn(tx)),
    };

    vi.mocked(anonymizeUserInTransaction).mockClear();

    const result = await mergeUsers(db as never, actorUserId, {
      keepUserId,
      mergeUserId,
    });

    expect(result).toEqual({ ok: true });
    expect(anonymizeUserInTransaction).toHaveBeenCalledWith(tx, mergeUserId, orgId);
  });

  it("scrubs merge user audit reasons before reassigning actor_user_id", async () => {
    const callOrder: string[] = [];
    vi.mocked(scrubAuditLogForUserPrivileged).mockImplementation(async () => {
      callOrder.push("scrub");
      return 1;
    });
    vi.mocked(reassignAuditActorsForUserMerge).mockImplementation(async () => {
      callOrder.push("reassign");
    });

    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([
        { id: keepUserId, status: ACCOUNT_STATUS.ACTIVE, organizationId: orgId },
        { id: mergeUserId, status: ACCOUNT_STATUS.ACTIVE, organizationId: orgId },
      ]),
      loginIdentity: { findMany: vi.fn().mockResolvedValue([]) },
      userRoleAssignment: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
      teacherAssignment: { findMany: vi.fn().mockResolvedValue([]) },
      lesson: { updateMany: vi.fn() },
      homeworkCheck: { updateMany: vi.fn() },
      brickLedger: { updateMany: vi.fn() },
    };

    const db = {
      $transaction: vi.fn(async (fn: (inner: unknown) => Promise<unknown>) => fn(tx)),
    };

    await mergeUsers(db as never, actorUserId, { keepUserId, mergeUserId });

    expect(scrubAuditLogForUserPrivileged).toHaveBeenCalledWith(tx, mergeUserId);
    expect(reassignAuditActorsForUserMerge).toHaveBeenCalledWith(tx, mergeUserId, keepUserId);
    expect(callOrder).toEqual(["scrub", "reassign"]);
  });

  it("rejects merging the same user id", async () => {
    const db = { $transaction: vi.fn() };
    const result = await mergeUsers(db as never, actorUserId, {
      keepUserId,
      mergeUserId: keepUserId,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
