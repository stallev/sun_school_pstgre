import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { changeLeadTeacher } from "./change-lead-teacher";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";
const yearId = "55555555-5555-4555-8555-555555555555";
const lessonId = "77777777-7777-4777-8777-777777777777";
const currentLeadId = "66666666-6666-4666-8666-666666666666";
const nextLeadId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const baseLesson = {
  id: lessonId,
  gradeId,
  academicYearId: yearId,
  title: "Урок",
  lessonDate: new Date("2026-10-15T00:00:00.000Z"),
  kind: "REGULAR",
  body: null,
  hasTest: false,
  leadTeacherId: currentLeadId,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
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
    },
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: yearId,
        status: "ACTIVE",
        startsOn: new Date("2026-09-01T00:00:00.000Z"),
        endsOn: new Date("2027-06-01T00:00:00.000Z"),
        organizationId: orgId,
      }),
    },
    teacherAssignment: {
      findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    ...overrides,
  };
}

describe("changeLeadTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_FOUND when teacher is not assigned to the lesson group", async () => {
    const tx = mockTx({
      teacherAssignment: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await changeLeadTeacher(db as never, actorUserId, {
      lessonId,
      leadTeacherId: nextLeadId,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("returns CHECK_LEAD_NOT_ASSIGNED when new lead has no assignment", async () => {
    const tx = mockTx({
      teacherAssignment: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "actor-assign" })
          .mockResolvedValueOnce(null),
      },
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ roles: [{ role: USER_ROLE.TEACHER }] })
          .mockResolvedValueOnce({ status: "ACTIVE", roles: [{ role: USER_ROLE.TEACHER }] }),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await changeLeadTeacher(db as never, actorUserId, {
      lessonId,
      leadTeacherId: nextLeadId,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_LEAD_NOT_ASSIGNED,
      message: "teacher.lesson.lead_not_assigned",
    });
  });

  it("writes lesson.lead_changed audit when lead teacher changes", async () => {
    const tx = mockTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ roles: [{ role: USER_ROLE.TEACHER }] })
          .mockResolvedValueOnce({ status: "ACTIVE", roles: [{ role: USER_ROLE.TEACHER }] }),
      },
      teacherAssignment: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "actor-assign" })
          .mockResolvedValueOnce({ id: "lead-assign" }),
      },
    });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await changeLeadTeacher(db as never, actorUserId, {
      lessonId,
      leadTeacherId: nextLeadId,
    });

    expect(result).toEqual({ ok: true });
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.LESSON_LEAD_CHANGED,
        entityId: lessonId,
        oldValue: { leadTeacherId: currentLeadId },
        newValue: { leadTeacherId: nextLeadId },
      }),
    );
  });
});
