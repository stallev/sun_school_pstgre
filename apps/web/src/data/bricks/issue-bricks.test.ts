import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { issueBricks } from "./issue-bricks";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

vi.mock("./revalidate-bricks-cache", () => ({
  revalidateBricksCaches: vi.fn(),
}));

const orgId = "22222222-2222-4222-8222-222222222222";
const actorTeacherId = "33333333-3333-4333-8333-333333333333";
const pupilId = "88888888-8888-4888-8888-888888888888";
const yearId = "55555555-5555-4555-8555-555555555555";
const gradeId = "44444444-4444-4444-8444-444444444444";
const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const baseInput = {
  pupilId,
  yearId,
  quantity: 3,
};

function mockTotals(earned: number, issued: number) {
  return {
    homeworkCheck: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { pointsTotal: earned } }),
    },
    brickLedger: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: issued } }),
      create: vi.fn().mockResolvedValue({ id: "ledger-1" }),
    },
    achievementAward: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }),
    },
    penalty: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    appSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };
}

function baseTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
    },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: yearId,
        status: ACADEMIC_YEAR_STATUS.ACTIVE,
        organizationId: orgId,
      }),
    },
    pupil: {
      findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
    },
    enrollment: {
      findMany: vi.fn().mockResolvedValue([{ gradeId }]),
    },
    teacherAssignment: {
      findFirst: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    auditLog: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
    ...mockTotals(10, 2),
    ...overrides,
  };
}

describe("issueBricks (bricks_ledger §6.2, §8–§10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns BRICKS_INSUFFICIENT when quantity exceeds balance", async () => {
    const tx = baseTx({ ...mockTotals(10, 9) });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await issueBricks(db as never, actorTeacherId, { ...baseInput, quantity: 5 });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.BRICKS_INSUFFICIENT,
      message: "teacher.bricks.insufficient",
    });
    expect(tx.brickLedger.create).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when teacher has no assignment for pupil groups", async () => {
    const tx = baseTx({
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await issueBricks(db as never, actorTeacherId, baseInput);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("creates only one ledger when concurrent submits share requestId (idempotency race)", async () => {
    const ledgerId = "ledger-race";
    let createCount = 0;
    let auditVisible = false;
    let pupilRowLocked = false;
    const lockWaiters: Array<() => void> = [];

    async function acquirePupilRowLock() {
      if (!pupilRowLocked) {
        pupilRowLocked = true;
        return;
      }
      await new Promise<void>((resolve) => {
        lockWaiters.push(resolve);
      });
      pupilRowLocked = true;
    }

    function releasePupilRowLock() {
      const next = lockWaiters.shift();
      if (next) next();
      else pupilRowLocked = false;
    }

    const tx = baseTx({
      auditLog: {
        findFirst: vi.fn().mockImplementation(async () =>
          auditVisible ? { entityId: ledgerId } : null,
        ),
      },
      $queryRaw: vi.fn().mockImplementation(async () => {
        await acquirePupilRowLock();
        return [{ id: pupilId }];
      }),
      homeworkCheck: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { pointsTotal: 10 } }),
      },
      brickLedger: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 2 } }),
        create: vi.fn().mockImplementation(async () => {
          createCount += 1;
          auditVisible = true;
          releasePupilRowLock();
          return { id: ledgerId };
        }),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const input = { ...baseInput, requestId };
    const [first, second] = await Promise.all([
      issueBricks(db as never, actorTeacherId, input),
      issueBricks(db as never, actorTeacherId, input),
    ]);

    expect(createCount).toBe(1);
    expect(first).toEqual({ ok: true, data: { ledgerId } });
    expect(second).toEqual({ ok: true, data: { ledgerId } });
  });

  it("is idempotent for the same requestId", async () => {
    const tx = baseTx({
      auditLog: {
        findFirst: vi.fn().mockResolvedValue({ entityId: "ledger-existing" }),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await issueBricks(db as never, actorTeacherId, { ...baseInput, requestId });

    expect(result).toEqual({ ok: true, data: { ledgerId: "ledger-existing" } });
    expect(tx.brickLedger.create).not.toHaveBeenCalled();
  });

  it("creates one ledger row and audit on success", async () => {
    const tx = baseTx();
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const { writeAudit } = await import("@sunschool/db");

    const result = await issueBricks(db as never, actorTeacherId, baseInput);

    expect(result.ok).toBe(true);
    expect(tx.brickLedger.create).toHaveBeenCalledTimes(1);
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.BRICKS_ISSUED,
        entityType: AUDIT_ENTITY_TYPE.BRICK_LEDGER,
        newValue: expect.objectContaining({ pupilId, quantity: 3 }),
      }),
    );
  });

  it("rejects a second issue when balance is exhausted inside the lock", async () => {
    let issued = 2;
    const tx = baseTx({
      homeworkCheck: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { pointsTotal: 10 } }),
      },
      brickLedger: {
        aggregate: vi
          .fn()
          .mockImplementation(async () => ({ _sum: { quantity: issued } })),
        create: vi.fn().mockImplementation(async () => {
          issued += 3;
          return { id: "ledger-1" };
        }),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const first = await issueBricks(db as never, actorTeacherId, baseInput);
    const second = await issueBricks(db as never, actorTeacherId, { ...baseInput, quantity: 6 });

    expect(first.ok).toBe(true);
    expect(second).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.BRICKS_INSUFFICIENT,
      message: "teacher.bricks.insufficient",
    });
  });
});
