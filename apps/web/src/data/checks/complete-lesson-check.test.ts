import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  LESSON_KIND,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { completeLessonCheck, completeLessonCheckInTransaction } from "./complete-lesson-check";

vi.mock("../bricks/revalidate-bricks-cache", () => ({
  revalidateBricksCachesForPupils: vi.fn(),
}));

vi.mock("../achievements/evaluate-pupil", () => ({
  maybeEvaluatePupilAchievements: vi.fn(),
}));

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";
const yearId = "55555555-5555-4555-8555-555555555555";
const lessonId = "77777777-7777-4777-8777-777777777777";
const pupilId = "88888888-8888-4888-8888-888888888888";

const lessonRow = {
  id: lessonId,
  gradeId,
  academicYearId: yearId,
  title: "Урок",
  lessonDate: new Date("2026-10-15T00:00:00.000Z"),
  kind: LESSON_KIND.REGULAR,
  body: null,
  hasTest: false,
  leadTeacherId: actorUserId,
  status: LESSON_STATUS.HELD,
  createdAt: new Date("2026-10-15T08:00:00.000Z"),
};

function mockTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findFirst: vi.fn().mockResolvedValue({
        roles: [{ role: USER_ROLE.TEACHER }],
      }),
      findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
    },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: yearId,
        status: ACADEMIC_YEAR_STATUS.ACTIVE,
        startsOn: new Date("2026-09-01T00:00:00.000Z"),
        endsOn: new Date("2027-06-01T00:00:00.000Z"),
        organizationId: orgId,
      }),
    },
    $queryRaw: vi
      .fn()
      .mockResolvedValueOnce([{ id: yearId }])
      .mockResolvedValueOnce([{ status: LESSON_STATUS.HELD }]),
    lesson: {
      findFirst: vi.fn().mockResolvedValue(lessonRow),
      update: vi.fn(),
    },
    teacherAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    appSetting: {
      findUnique: vi.fn().mockResolvedValue({ value: false }),
    },
    homeworkCheck: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([]),
    },
    auditLog: { create: vi.fn() },
    ...overrides,
  };
}

describe("completeLessonCheckInTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns CHECK_NOTHING_CHECKED when no pupil is checked", async () => {
    const tx = mockTx({
      homeworkCheck: { count: vi.fn().mockResolvedValue(0) },
    });
    const result = await completeLessonCheckInTransaction(tx as never, actorUserId, orgId, lessonId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.CHECK_NOTHING_CHECKED);
    expect(tx.lesson.update).not.toHaveBeenCalled();
  });

  it("transitions HELD to CHECK_COMPLETED and writes lesson.check_completed audit", async () => {
    const { writeAudit } = await import("@sunschool/db");
    const tx = mockTx();
    const result = await completeLessonCheckInTransaction(tx as never, actorUserId, orgId, lessonId);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe(LESSON_STATUS.CHECK_COMPLETED);
    expect(tx.lesson.update).toHaveBeenCalledWith({
      where: { id: lessonId },
      data: { status: LESSON_STATUS.CHECK_COMPLETED },
    });
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: AUDIT_ACTION.LESSON_CHECK_COMPLETED, entityId: lessonId }),
    );
  });

  it("is idempotent when lesson is already CHECK_COMPLETED", async () => {
    const { writeAudit } = await import("@sunschool/db");
    const tx = mockTx({
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: yearId }])
        .mockResolvedValueOnce([{ status: LESSON_STATUS.CHECK_COMPLETED }]),
    });
    const result = await completeLessonCheckInTransaction(tx as never, actorUserId, orgId, lessonId);
    expect(result.ok).toBe(true);
    expect(tx.lesson.update).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for foreign lesson", async () => {
    const tx = mockTx({
      lesson: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
    });
    const result = await completeLessonCheckInTransaction(tx as never, actorUserId, orgId, lessonId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.NOT_FOUND);
  });
});

describe("completeLessonCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates bricks caches for checked pupils after HELD → CHECK_COMPLETED", async () => {
    const { revalidateBricksCachesForPupils } = await import("../bricks/revalidate-bricks-cache");
    const tx = mockTx({
      homeworkCheck: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{ pupilId }]),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await completeLessonCheck(db as never, actorUserId, { lessonId });

    expect(result.ok).toBe(true);
    expect(revalidateBricksCachesForPupils).toHaveBeenCalledWith([pupilId], yearId);
  });

  it("does not revalidate bricks caches on idempotent CHECK_COMPLETED", async () => {
    const { revalidateBricksCachesForPupils } = await import("../bricks/revalidate-bricks-cache");
    const tx = mockTx({
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: yearId }])
        .mockResolvedValueOnce([{ status: LESSON_STATUS.CHECK_COMPLETED }]),
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await completeLessonCheck(db as never, actorUserId, { lessonId });

    expect(result.ok).toBe(true);
    expect(revalidateBricksCachesForPupils).not.toHaveBeenCalled();
  });
});
