import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  LESSON_KIND,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { createLesson, createLessonInTransaction } from "./create-lesson";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";
const yearId = "55555555-5555-4555-8555-555555555555";
const leadId = "66666666-6666-4666-8666-666666666666";
const bookId = "88888888-8888-4888-8888-888888888888";
const translationId = "99999999-9999-4999-8999-999999999999";

const singleVerse = {
  bookId,
  startChapter: 1,
  startVerse: 1,
  endChapter: 1,
  endVerse: 1,
};

const baseInput = {
  gradeId,
  title: "Урок",
  lessonDate: "2026-10-15",
  kind: LESSON_KIND.REGULAR,
  leadTeacherId: leadId,
  hasTest: false,
  verses: [],
};

function mockTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findFirst: vi.fn().mockResolvedValue({
        status: "ACTIVE",
        roles: [{ role: USER_ROLE.TEACHER }],
      }),
      findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
    },
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: yearId,
        status: ACADEMIC_YEAR_STATUS.ACTIVE,
        startsOn: new Date("2026-09-01T00:00:00.000Z"),
        endsOn: new Date("2027-06-01T00:00:00.000Z"),
        organizationId: orgId,
      }),
      findMany: vi.fn(),
    },
    grade: {
      findFirst: vi.fn().mockResolvedValue({
        id: gradeId,
        name: "G",
        isActive: true,
        language: "ru",
        organizationId: orgId,
      }),
    },
    teacherAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: yearId }]),
    gradeSettings: {
      findUnique: vi.fn().mockResolvedValue({ maxVersesPerLesson: 3 }),
    },
    lesson: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]), update: vi.fn() },
    goldenVerse: { findFirst: vi.fn(), create: vi.fn() },
    lessonGoldenVerse: { deleteMany: vi.fn(), create: vi.fn() },
    gradeEvent: { findFirst: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
    bibleTranslation: { findFirst: vi.fn() },
    bibleVerse: { findMany: vi.fn().mockResolvedValue([]) },
    bibleVerseMap: { findMany: vi.fn().mockResolvedValue([]) },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    ...overrides,
  };
}

describe("createLessonInTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns CHECK_YEAR_NOT_ACTIVE when lesson date is outside the active year", async () => {
    const tx = mockTx({
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: ACADEMIC_YEAR_STATUS.ACTIVE,
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2026-10-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
      },
    });

    const result = await createLessonInTransaction(tx as never, actorUserId, orgId, {
      ...baseInput,
      lessonDate: "2026-11-01",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_YEAR_NOT_ACTIVE,
      message: "teacher.lesson.year_not_active",
    });
  });

  it("returns NOT_FOUND when teacher is not assigned to the group", async () => {
    const tx = mockTx({
      teacherAssignment: { findUnique: vi.fn().mockResolvedValue(null) },
    });

    const result = await createLessonInTransaction(tx as never, actorUserId, orgId, baseInput);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("returns CHECK_LEAD_NOT_ASSIGNED when lead teacher has no assignment", async () => {
    const tx = mockTx({
      teacherAssignment: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "actor-assign" })
          .mockResolvedValueOnce(null),
      },
    });

    const result = await createLessonInTransaction(tx as never, actorUserId, orgId, baseInput);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_LEAD_NOT_ASSIGNED,
      message: "teacher.lesson.lead_not_assigned",
    });
  });

  it("returns CHECK_VERSES_LIMIT when verse count exceeds grade limit", async () => {
    const tx = mockTx();
    const result = await createLessonInTransaction(tx as never, actorUserId, orgId, {
      ...baseInput,
      verses: [singleVerse, singleVerse, singleVerse, singleVerse],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSES_LIMIT,
      message: "teacher.lesson.verses_limit",
    });
  });

  it("returns CHECK_VERSE_MISSING with missing[] when verse text is absent", async () => {
    const tx = mockTx({
      bibleTranslation: {
        findFirst: vi.fn().mockResolvedValue({ id: translationId }),
      },
      bibleVerse: {
        findMany: vi.fn().mockResolvedValue([
          { bookId, chapterNumber: 1, verseNumber: 1 },
        ]),
      },
      bibleVerseMap: { findMany: vi.fn().mockResolvedValue([]) },
    });

    const result = await createLessonInTransaction(tx as never, actorUserId, orgId, {
      ...baseInput,
      verses: [singleVerse],
    });

    expect(result).toMatchObject({
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_VERSE_MISSING,
      message: "teacher.lesson.verses_missing",
      missing: [{ bookId, chapter: 1, verse: 1 }],
    });
  });

  it("writes lesson.created audit on success", async () => {
    const lessonId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const tx = mockTx({
      lesson: {
        create: vi.fn().mockResolvedValue({
          id: lessonId,
          gradeId,
          title: baseInput.title,
          lessonDate: new Date("2026-10-15T00:00:00.000Z"),
        }),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    });

    const result = await createLessonInTransaction(tx as never, actorUserId, orgId, baseInput);

    expect(result).toEqual({ ok: true, data: { lessonId } });
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.LESSON_CREATED,
        entityId: lessonId,
      }),
    );
  });
});

describe("createLesson", () => {
  it("returns VALIDATION for REVIEW lesson with verses", async () => {
    const db = { $transaction: vi.fn() };

    const result = await createLesson(db as never, actorUserId, {
      ...baseInput,
      kind: LESSON_KIND.REVIEW,
      verses: [singleVerse],
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      fields: { verses: "teacher.lesson.review_no_verses" },
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
