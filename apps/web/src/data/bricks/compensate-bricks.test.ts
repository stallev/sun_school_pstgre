import { describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { compensateBricks } from "./compensate-bricks";

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
const requestId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function baseTx(issued: number, overrides: Record<string, unknown> = {}) {
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
    homeworkCheck: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { pointsTotal: 20 } }),
    },
    brickLedger: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: issued } }),
      create: vi.fn().mockResolvedValue({ id: "ledger-comp" }),
    },
    achievementAward: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }),
    },
    penalty: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    ...overrides,
  };
}

describe("compensateBricks (bricks_ledger §6.3, §8)", () => {
  it("returns BRICKS_COMPENSATE_EXCEEDS when magnitude exceeds issued", async () => {
    const tx = baseTx(2);
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await compensateBricks(db as never, actorTeacherId, {
      pupilId,
      yearId,
      quantity: -5,
      note: "fix",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.BRICKS_COMPENSATE_EXCEEDS,
      message: "teacher.bricks.compensate_exceeds",
    });
  });

  it("returns VALIDATION when note is missing", async () => {
    const tx = baseTx(5);
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await compensateBricks(db as never, actorTeacherId, {
      pupilId,
      yearId,
      quantity: -1,
      note: "   ",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
  });

  it("creates only one ledger when concurrent submits share requestId (idempotency race)", async () => {
    const ledgerId = "ledger-comp-race";
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

    const tx = baseTx(5, {
      auditLog: {
        findFirst: vi.fn().mockImplementation(async () =>
          auditVisible ? { entityId: ledgerId } : null,
        ),
      },
      $queryRaw: vi.fn().mockImplementation(async () => {
        await acquirePupilRowLock();
        return [{ id: pupilId }];
      }),
      brickLedger: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 5 } }),
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

    const input = {
      pupilId,
      yearId,
      quantity: -1,
      note: "fix",
      requestId,
    };
    const [first, second] = await Promise.all([
      compensateBricks(db as never, actorTeacherId, input),
      compensateBricks(db as never, actorTeacherId, input),
    ]);

    expect(createCount).toBe(1);
    expect(first).toEqual({ ok: true, data: { ledgerId } });
    expect(second).toEqual({ ok: true, data: { ledgerId } });
  });

  it("appends a negative ledger row and audit (INV-17)", async () => {
    const tx = baseTx(5);
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const { writeAudit } = await import("@sunschool/db");

    const result = await compensateBricks(db as never, actorTeacherId, {
      pupilId,
      yearId,
      quantity: -2,
      note: "ошибка",
    });

    expect(result.ok).toBe(true);
    expect(tx.brickLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quantity: -2, note: "ошибка" }),
      }),
    );
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: AUDIT_ACTION.BRICKS_COMPENSATED }),
    );
  });
});
