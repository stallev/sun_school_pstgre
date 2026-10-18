import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  LESSON_KIND,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { saveCheckInTransaction } from "./check-shared.server";

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

const baseInput = {
  lessonId,
  pupilId,
  lessonKind: LESSON_KIND.REGULAR,
  present: true,
  notebookScore: 8,
};

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

function mockTx(overrides: Record<string, unknown> = {}) {
  const updatedAt = new Date("2026-10-16T10:00:00.000Z");
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
      .mockResolvedValueOnce([{ id: pupilId }])
      .mockResolvedValue([]),
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
        weights: {},
      }),
    },
    homeworkCheck: {
      create: vi.fn().mockResolvedValue({ id: checkId }),
      update: vi.fn().mockResolvedValue({ id: checkId, updatedAt }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: checkId,
        present: true,
        testScore: null,
        notebookScore: 8,
        singing: false,
        homeworkChecked: false,
        verseScores: [],
        updatedAt,
      }),
    },
    homeworkScoreEvent: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    homeworkVerseScore: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    ...overrides,
  };
}

describe("saveCheckInTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns VALIDATION when client sends REGULAR lessonKind but DB lesson is REVIEW with testScore", async () => {
    const tx = mockTx({
      lesson: {
        findFirst: vi.fn().mockResolvedValue({ ...lessonRow, kind: LESSON_KIND.REVIEW }),
        findMany: vi.fn().mockResolvedValue([{ ...lessonRow, kind: LESSON_KIND.REVIEW }]),
      },
    });
    const result = await saveCheckInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { ...baseInput, lessonKind: LESSON_KIND.REGULAR, testScore: 8 },
      "partial",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
      expect(result.fields?.testScore).toBe("teacher.lesson.review_no_verses");
    }
    expect(tx.homeworkCheck.create).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when pupil is not enrolled on the lesson date", async () => {
    const tx = mockTx({
      enrollment: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const result = await saveCheckInTransaction(tx as never, actorUserId, orgId, baseInput, "checked");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.NOT_FOUND);
  });

  it("returns CONFLICT when expectedUpdatedAt is stale", async () => {
    const tx = mockTx({
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: yearId }])
        .mockResolvedValueOnce([{ id: pupilId }])
        .mockResolvedValueOnce([
          {
            id: checkId,
            lessonId,
            pupilId,
            present: true,
            homeworkChecked: false,
            testScore: null,
            notebookScore: 8,
            singing: false,
            comment: null,
            updatedAt: new Date("2026-10-16T10:00:00.000Z"),
          },
        ]),
    });
    const result = await saveCheckInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { ...baseInput, expectedUpdatedAt: "2026-10-15T10:00:00.000Z" },
      "partial",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.CONFLICT);
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
    const result = await saveCheckInTransaction(tx as never, actorUserId, orgId, baseInput, "checked");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.FORBIDDEN);
  });

  it("saveChecked freezes points and writes check.saved audit", async () => {
    const { writeAudit } = await import("@sunschool/db");
    const tx = mockTx();
    const result = await saveCheckInTransaction(tx as never, actorUserId, orgId, baseInput, "checked");
    expect(result.ok).toBe(true);
    expect(tx.homeworkCheck.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          homeworkChecked: true,
          pointsTotal: expect.any(Number),
          scoringSnapshot: expect.any(Object),
        }),
      }),
    );
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: AUDIT_ACTION.CHECK_SAVED, entityId: checkId }),
    );
  });

  it("savePartialCheck creates score events for changed fields", async () => {
    const tx = mockTx();
    const result = await saveCheckInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { ...baseInput, present: false, notebookScore: 5 },
      "partial",
    );
    expect(result.ok).toBe(true);
    expect(tx.homeworkScoreEvent.create).toHaveBeenCalled();
  });

  it("keeps frozen points when grade weights change later (INV-13)", async () => {
    let weights: Record<string, number> = { notebook: 2 };
    const gradeSettingsFindUnique = vi.fn().mockImplementation(() =>
      Promise.resolve({
        useVerses: false,
        useTest: false,
        useNotebook: true,
        useSinging: false,
        maxVersesPerLesson: 3,
        weights,
      }),
    );
    const tx = mockTx({
      gradeSettings: { findUnique: gradeSettingsFindUnique },
    });
    const first = await saveCheckInTransaction(tx as never, actorUserId, orgId, baseInput, "checked");
    expect(first.ok).toBe(true);
    expect(tx.homeworkCheck.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pointsTotal: 16,
          scoringSnapshot: expect.objectContaining({
            weights: expect.objectContaining({ notebook: 2 }),
          }),
        }),
      }),
    );

    weights = { notebook: 99 };
    const updatedAt = new Date("2026-10-16T10:00:00.000Z");
    vi.mocked(tx.$queryRaw)
      .mockReset()
      .mockResolvedValueOnce([{ id: yearId }])
      .mockResolvedValueOnce([{ id: pupilId }])
      .mockResolvedValueOnce([
        {
          id: checkId,
          lessonId,
          pupilId,
          present: true,
          homeworkChecked: true,
          testScore: null,
          notebookScore: 8,
          singing: false,
          comment: null,
          updatedAt,
        },
      ]);
    const second = await saveCheckInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { ...baseInput, expectedUpdatedAt: updatedAt.toISOString() },
      "checked",
    );
    expect(second.ok).toBe(true);
    expect(tx.homeworkCheck.update).toHaveBeenCalledTimes(1);
    expect(gradeSettingsFindUnique).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when saveChecked repeats unchanged checked record", async () => {
    const updatedAt = new Date("2026-10-16T10:00:00.000Z");
    const tx = mockTx({
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: yearId }])
        .mockResolvedValueOnce([{ id: pupilId }])
        .mockResolvedValueOnce([
          {
            id: checkId,
            lessonId,
            pupilId,
            present: true,
            homeworkChecked: true,
            testScore: null,
            notebookScore: 8,
            singing: false,
            comment: null,
            updatedAt,
          },
        ]),
    });
    const result = await saveCheckInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { ...baseInput, expectedUpdatedAt: updatedAt.toISOString() },
      "checked",
    );
    expect(result.ok).toBe(true);
    expect(tx.homeworkCheck.update).not.toHaveBeenCalled();
  });
});
