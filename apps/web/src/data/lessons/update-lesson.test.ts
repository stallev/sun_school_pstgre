import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  LESSON_KIND,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { updateLesson, updateLessonInTransaction } from "./update-lesson";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";
const yearId = "55555555-5555-4555-8555-555555555555";
const leadId = "66666666-6666-4666-8666-666666666666";
const lessonId = "77777777-7777-4777-8777-777777777777";
const bookId = "88888888-8888-4888-8888-888888888888";

const baseLesson = {
  id: lessonId,
  gradeId,
  academicYearId: yearId,
  title: "Урок",
  lessonDate: new Date("2026-10-15T00:00:00.000Z"),
  kind: LESSON_KIND.REGULAR,
  body: null,
  hasTest: false,
  leadTeacherId: leadId,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
};

const baseInput = {
  lessonId,
  title: "Новый заголовок",
  lessonDate: "2026-10-15",
  kind: LESSON_KIND.REGULAR,
  leadTeacherId: leadId,
  hasTest: false,
  verses: [] as {
    bookId: string;
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
  }[],
};

function mockTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
    },
    lesson: {
      findFirst: vi.fn().mockResolvedValue(baseLesson),
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: yearId,
        status: ACADEMIC_YEAR_STATUS.ACTIVE,
        startsOn: new Date("2026-09-01T00:00:00.000Z"),
        endsOn: new Date("2027-06-01T00:00:00.000Z"),
        organizationId: orgId,
      }),
    },
    teacherAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: yearId }]),
    grade: {
      findFirst: vi.fn().mockResolvedValue({
        id: gradeId,
        name: "G",
        isActive: true,
        language: "ru",
        organizationId: orgId,
      }),
    },
    gradeSettings: {
      findUnique: vi.fn().mockResolvedValue({ maxVersesPerLesson: 3 }),
    },
    homeworkCheck: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn() },
    lessonGoldenVerse: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn(), create: vi.fn() },
    goldenVerse: { findFirst: vi.fn(), create: vi.fn() },
    gradeEvent: { updateMany: vi.fn() },
    bibleTranslation: { findFirst: vi.fn() },
    bibleVerse: { findMany: vi.fn().mockResolvedValue([]) },
    bibleVerseMap: { findMany: vi.fn().mockResolvedValue([]) },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    ...overrides,
  };
}

describe("updateLessonInTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_FOUND when teacher is not assigned to the lesson group", async () => {
    const tx = mockTx({
      teacherAssignment: { findUnique: vi.fn().mockResolvedValue(null) },
    });

    const result = await updateLessonInTransaction(tx as never, actorUserId, orgId, baseInput);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("returns CHECK_VERSE_LOCKED when verses change after homework checks exist", async () => {
    const linkedVerse = {
      goldenVerse: {
        bookId,
        startChapter: 1,
        startVerse: 1,
        endChapter: 1,
        endVerse: 1,
      },
    };
    const tx = mockTx({
      homeworkCheck: { count: vi.fn().mockResolvedValue(2) },
      lessonGoldenVerse: { findMany: vi.fn().mockResolvedValue([linkedVerse]) },
    });

    const result = await updateLessonInTransaction(tx as never, actorUserId, orgId, {
      ...baseInput,
      verses: [
        {
          bookId,
          startChapter: 1,
          startVerse: 2,
          endChapter: 1,
          endVerse: 2,
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSE_LOCKED,
      message: "teacher.lesson.verse_locked",
      fields: { verses: "teacher.lesson.verse_locked" },
    });
  });

  it("returns CHECK_VERSES_LIMIT when verse count exceeds grade limit", async () => {
    const verse = {
      bookId,
      startChapter: 1,
      startVerse: 1,
      endChapter: 1,
      endVerse: 1,
    };
    const tx = mockTx();

    const result = await updateLessonInTransaction(tx as never, actorUserId, orgId, {
      ...baseInput,
      verses: [verse, verse, verse, verse],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSES_LIMIT,
      message: "teacher.lesson.verses_limit",
    });
  });

  it("writes lesson.updated audit on success", async () => {
    const tx = mockTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({
          status: "ACTIVE",
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      teacherAssignment: {
        findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
      },
    });

    const result = await updateLessonInTransaction(tx as never, actorUserId, orgId, baseInput);

    expect(result).toEqual({ ok: true });
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.LESSON_UPDATED,
        entityId: lessonId,
      }),
    );
  });
});

describe("updateLesson", () => {
  it("returns VALIDATION for REVIEW lesson with verses", async () => {
    const db = { $transaction: vi.fn() };

    const result = await updateLesson(db as never, actorUserId, {
      ...baseInput,
      kind: LESSON_KIND.REVIEW,
      verses: [
        {
          bookId,
          startChapter: 1,
          startVerse: 1,
          endChapter: 1,
          endVerse: 1,
        },
      ],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      fields: { verses: "teacher.lesson.review_no_verses" },
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when lesson does not exist in organization", async () => {
    const tx = mockTx({
      lesson: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await updateLesson(db as never, actorUserId, baseInput);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });
});
