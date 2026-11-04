import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  LESSON_KIND,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { finishLessonTableCheck } from "./finish-lesson-table-check";

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
const checkId = "99999999-9999-4999-8999-999999999999";

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

const updatedAt = new Date("2026-10-16T10:00:00.000Z");

const checkRow = {
  id: checkId,
  lessonId,
  pupilId,
  present: true,
  homeworkChecked: false,
  testScore: null,
  notebookScore: 8,
  singing: false,
  comment: null,
  updatedAt,
};

function mockTx() {
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
      .mockResolvedValueOnce([checkRow])
      .mockResolvedValueOnce([{ id: yearId }])
      .mockResolvedValueOnce([{ status: LESSON_STATUS.HELD }]),
    lesson: {
      findFirst: vi.fn().mockResolvedValue(lessonRow),
      findMany: vi.fn().mockResolvedValue([lessonRow]),
      update: vi.fn(),
    },
    teacherAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    enrollment: {
      findFirst: vi.fn().mockResolvedValue({ id: "enroll-1" }),
    },
    appSetting: {
      findUnique: vi.fn().mockResolvedValue({ value: "Europe/Moscow" }),
    },
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
      findMany: vi.fn().mockResolvedValue([
        { pupilId, lesson: { kind: LESSON_KIND.REGULAR } },
      ]),
      count: vi.fn().mockResolvedValue(1),
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
    homeworkScoreEvent: {
      createMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    homeworkVerseScore: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

describe("finishLessonTableCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("freezes partial rows and completes the lesson", async () => {
    const tx = mockTx();
    const db = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      appSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "Europe/Moscow" }),
      },
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await finishLessonTableCheck(db as never, actorUserId, { lessonId });

    expect(result.ok).toBe(true);
    expect(tx.homeworkCheck.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ homeworkChecked: true }),
      }),
    );
    expect(tx.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: LESSON_STATUS.CHECK_COMPLETED },
      }),
    );
  });

  it("returns CHECK_NOTHING_CHECKED when the lesson has no rows", async () => {
    const tx = mockTx();
    tx.homeworkCheck.findMany.mockResolvedValue([]);
    tx.homeworkCheck.count.mockResolvedValue(0);
    tx.$queryRaw = vi
      .fn()
      .mockResolvedValueOnce([{ id: yearId }])
      .mockResolvedValueOnce([{ status: LESSON_STATUS.HELD }]);
    const db = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      appSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "Europe/Moscow" }),
      },
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await finishLessonTableCheck(db as never, actorUserId, { lessonId });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(MUTATION_ERROR_CODES.CHECK_NOTHING_CHECKED);
    }
    expect(tx.homeworkCheck.update).not.toHaveBeenCalled();
    expect(tx.lesson.update).not.toHaveBeenCalled();
  });

  it("keeps presence from the locked row when the list snapshot is older", async () => {
    const tx = mockTx();
    tx.homeworkCheck.findMany.mockResolvedValue([
      { pupilId, present: false, lesson: { kind: LESSON_KIND.REGULAR } },
    ]);
    const db = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      appSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "Europe/Moscow" }),
      },
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await finishLessonTableCheck(db as never, actorUserId, { lessonId });

    expect(result.ok).toBe(true);
    expect(tx.homeworkCheck.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          homeworkChecked: true,
          present: true,
        }),
      }),
    );
    expect(tx.homeworkCheck.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ present: false }),
      }),
    );
  });
});
