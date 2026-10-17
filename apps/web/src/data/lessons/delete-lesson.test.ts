import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { deleteLesson } from "./delete-lesson";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const lessonId = "77777777-7777-4777-8777-777777777777";

describe("deleteLesson", () => {
  it("returns FORBIDDEN when teacher deletes a lesson with homework checks", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
      },
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: lessonId,
          gradeId: "44444444-4444-4444-8444-444444444444",
          academicYearId: "55555555-5555-4555-8555-555555555555",
          title: "L",
          lessonDate: new Date("2026-10-01T00:00:00.000Z"),
          kind: "REGULAR",
          body: null,
          hasTest: false,
          leadTeacherId: actorUserId,
          createdAt: new Date(),
        }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: "55555555-5555-4555-8555-555555555555",
          status: "ACTIVE",
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
      },
      teacherAssignment: {
        findUnique: vi.fn().mockResolvedValue({ id: "assign" }),
      },
      homeworkCheck: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn(),
      },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await deleteLesson(db as never, actorUserId, { lessonId });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
  });

  it("returns NOT_FOUND when teacher is not assigned to the lesson group", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
      },
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: lessonId,
          gradeId: "44444444-4444-4444-8444-444444444444",
          academicYearId: "55555555-5555-4555-8555-555555555555",
          title: "L",
          lessonDate: new Date("2026-10-01T00:00:00.000Z"),
          kind: "REGULAR",
          body: null,
          hasTest: false,
          leadTeacherId: actorUserId,
          createdAt: new Date(),
        }),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: "55555555-5555-4555-8555-555555555555",
          status: "ACTIVE",
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
      },
      teacherAssignment: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      homeworkCheck: { count: vi.fn(), findMany: vi.fn() },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await deleteLesson(db as never, actorUserId, { lessonId });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("writes lesson.deleted audit when admin deletes a lesson with checks", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.ADMIN }] }),
      },
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: lessonId,
          gradeId: "44444444-4444-4444-8444-444444444444",
          academicYearId: "55555555-5555-4555-8555-555555555555",
          title: "L",
          lessonDate: new Date("2026-10-01T00:00:00.000Z"),
          kind: "REGULAR",
          body: null,
          hasTest: false,
          leadTeacherId: actorUserId,
          createdAt: new Date(),
        }),
        delete: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      academicYear: { findFirst: vi.fn() },
      teacherAssignment: { findUnique: vi.fn() },
      homeworkCheck: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{ id: "check-1" }]),
        deleteMany: vi.fn(),
      },
      homeworkScoreEvent: { deleteMany: vi.fn() },
      homeworkVerseScore: { deleteMany: vi.fn() },
      lessonGoldenVerse: { deleteMany: vi.fn() },
      gradeEvent: { updateMany: vi.fn() },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "admin-role", role: USER_ROLE.ADMIN }),
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await deleteLesson(db as never, actorUserId, { lessonId });

    expect(result).toEqual({ ok: true });
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.LESSON_DELETED,
        entityId: lessonId,
      }),
    );
  });
});
