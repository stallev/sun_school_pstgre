import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  LESSON_KIND,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { overrideVerseScoreInTransaction } from "./check-shared.server";

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
const checkId = "99999999-9999-4999-8999-999999999999";
const lessonVerseId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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
  status: "HELD",
  createdAt: new Date("2026-10-15T08:00:00.000Z"),
};

const checkedRow = {
  id: checkId,
  lessonId,
  pupilId,
  present: true,
  homeworkChecked: true,
  testScore: null,
  notebookScore: 8,
  singing: false,
  comment: null,
  updatedAt: new Date("2026-10-16T10:00:00.000Z"),
};

function mockTx(overrides: Record<string, unknown> = {}) {
  const updatedAt = new Date("2026-10-16T11:00:00.000Z");
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
      .mockResolvedValueOnce([checkedRow]),
    lesson: {
      findFirst: vi.fn().mockResolvedValue(lessonRow),
      findMany: vi.fn().mockResolvedValue([lessonRow]),
    },
    teacherAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    enrollment: {
      findFirst: vi.fn().mockResolvedValue({ id: "enroll-1" }),
    },
    appSetting: { findFirst: vi.fn().mockResolvedValue({ value: "Europe/Moscow" }) },
    gradeSettings: {
      findUnique: vi.fn().mockResolvedValue({
        useVerses: true,
        useTest: true,
        useNotebook: true,
        useSinging: true,
        maxVersesPerLesson: 3,
        weights: { verses: 1 },
      }),
    },
    homeworkCheck: {
      update: vi.fn().mockResolvedValue({ id: checkId, updatedAt }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        verseScores: [{ score: 2 }],
        testScore: null,
        notebookScore: 8,
        singing: false,
      }),
    },
    homeworkScoreEvent: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    homeworkVerseScore: {
      findMany: vi.fn().mockResolvedValue([{ lessonVerseId, score: 1 }]),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    ...overrides,
  };
}

describe("overrideVerseScoreInTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns CHECK_NO_CHANGES when verse score is unchanged", async () => {
    const tx = mockTx();
    const result = await overrideVerseScoreInTransaction(tx as never, actorUserId, orgId, {
      lessonId,
      pupilId,
      lessonVerseId,
      score: 1,
      expectedUpdatedAt: checkedRow.updatedAt.toISOString(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.CHECK_NO_CHANGES);
  });

  it("returns FORBIDDEN for teacher when year is closed", async () => {
    const tx = mockTx({
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: ACADEMIC_YEAR_STATUS.CLOSED,
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
      },
    });
    const result = await overrideVerseScoreInTransaction(tx as never, actorUserId, orgId, {
      lessonId,
      pupilId,
      lessonVerseId,
      score: 2,
      expectedUpdatedAt: checkedRow.updatedAt.toISOString(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.FORBIDDEN);
    expect(tx.homeworkVerseScore.upsert).not.toHaveBeenCalled();
  });

  it("writes check.verse_overridden audit and recalculates points", async () => {
    const { writeAudit } = await import("@sunschool/db");
    const tx = mockTx();
    const result = await overrideVerseScoreInTransaction(tx as never, actorUserId, orgId, {
      lessonId,
      pupilId,
      lessonVerseId,
      score: 2,
      expectedUpdatedAt: checkedRow.updatedAt.toISOString(),
    });
    expect(result.ok).toBe(true);
    expect(tx.homeworkVerseScore.upsert).toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: AUDIT_ACTION.CHECK_VERSE_OVERRIDDEN, entityId: checkId }),
    );
  });
});
