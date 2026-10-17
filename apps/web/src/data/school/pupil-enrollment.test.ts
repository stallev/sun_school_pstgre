import { describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { enrollPupil } from "./enroll-pupil";
import { transferPupil } from "./transfer-pupil";
import { unenrollPupil, unenrollPupilInTransaction } from "./unenroll-pupil";

const orgId = "33333333-3333-4333-8333-333333333333";
const actorAdminId = "55555555-5555-4555-8555-555555555555";
const actorTeacherId = "88888888-8888-4888-8888-888888888888";
const pupilId = "66666666-6666-4666-8666-666666666666";
const gradeId = "11111111-1111-4111-8111-111111111111";
const otherGradeId = "99999999-9999-4999-8999-999999999999";
const yearId = "22222222-2222-4222-8222-222222222222";
const enrollmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function baseTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      findFirst: vi.fn(),
    },
    appSetting: {
      findUnique: vi.fn().mockResolvedValue({ value: null }),
    },
    pupil: {
      findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({ id: yearId, status: ACADEMIC_YEAR_STATUS.ACTIVE }),
    },
    grade: {
      findFirst: vi.fn().mockResolvedValue({
        id: gradeId,
        name: "G1",
        isActive: true,
        language: "RU",
      }),
    },
    childDataConsent: { findMany: vi.fn().mockResolvedValue([]) },
    enrollment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    userRoleAssignment: { findFirst: vi.fn() },
    teacherAssignment: { findUnique: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue(undefined) },
    ...overrides,
  };
}

describe("enrollPupil", () => {
  it("returns SCHOOL_CONSENT_REQUIRED without consent", async () => {
    const tx = baseTx();
    tx.userRoleAssignment.findFirst = vi.fn().mockResolvedValue({ id: "r1" });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await enrollPupil(db as never, actorAdminId, {
      pupilId,
      gradeId,
      startsOn: "2026-10-01",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_CONSENT_REQUIRED,
      message: "admin.people.consent_required",
    });
  });

  it("returns NOT_FOUND when teacher is not assigned to the group", async () => {
    const tx = baseTx({
      childDataConsent: {
        findMany: vi.fn().mockResolvedValue([{ status: CONSENT_STATUS.ACTIVE }]),
      },
    });
    tx.userRoleAssignment.findFirst = vi.fn().mockResolvedValue(null);
    tx.appUser.findFirst = vi.fn().mockResolvedValue({
      roles: [{ role: USER_ROLE.TEACHER }],
    });
    tx.teacherAssignment.findUnique = vi.fn().mockResolvedValue(null);
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await enrollPupil(db as never, actorTeacherId, {
      pupilId,
      gradeId,
      startsOn: "2026-10-01",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });
});

describe("unenrollPupil", () => {
  it("returns SCHOOL_NOT_ENROLLED without active enrollment", async () => {
    const tx = baseTx();
    tx.userRoleAssignment.findFirst = vi.fn().mockResolvedValue({ id: "r1" });
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await unenrollPupil(db as never, actorAdminId, {
      pupilId,
      endsOn: "2026-10-01",
    });

    expect(result?.ok === false && result.code).toBe(MUTATION_ERROR_CODES.SCHOOL_NOT_ENROLLED);
  });
});

describe("transferPupil", () => {
  it("returns FORBIDDEN for teacher actor", async () => {
    const tx = baseTx();
    tx.userRoleAssignment.findFirst = vi.fn().mockResolvedValue(null);
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await transferPupil(db as never, actorTeacherId, {
      pupilId,
      toGradeId: otherGradeId,
      onDate: "2026-10-05",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
  });
});

describe("unenroll race", () => {
  it("returns CONFLICT when active enrollment was already closed", async () => {
    const tx = baseTx({
      enrollment: {
        findFirst: vi.fn().mockResolvedValue({
          id: enrollmentId,
          gradeId,
          academicYearId: yearId,
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    });
    tx.userRoleAssignment.findFirst = vi.fn().mockResolvedValue({ id: "r1" });

    const result = await unenrollPupilInTransaction(tx as never, actorAdminId, orgId, {
      pupilId,
      endsOn: "2026-10-01",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CONFLICT,
      message: "common.errors.conflict",
    });
  });
});
