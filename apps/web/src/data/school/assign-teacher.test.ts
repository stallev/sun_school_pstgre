import { describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { assignTeacher } from "./assign-teacher";

const gradeId = "11111111-1111-4111-8111-111111111111";
const yearId = "22222222-2222-4222-8222-222222222222";
const userId = "44444444-4444-4444-8444-444444444444";
const orgId = "33333333-3333-4333-8333-333333333333";
const actorUserId = "55555555-5555-4555-8555-555555555555";

describe("assignTeacher", () => {
  it("returns SCHOOL_NOT_A_TEACHER when user lacks TEACHER role", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
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
      teacherAssignment: { findUnique: vi.fn(), create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await assignTeacher(db as never, actorUserId, {
      userId,
      gradeId,
      yearId,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_NOT_A_TEACHER,
      message: "admin.group.not_teacher",
    });
  });

  it("returns SCHOOL_GROUP_INACTIVE for inactive group", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn(),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({ id: yearId, status: ACADEMIC_YEAR_STATUS.ACTIVE }),
      },
      grade: {
        findFirst: vi.fn().mockResolvedValue({
          id: gradeId,
          name: "G1",
          isActive: false,
          language: "RU",
        }),
      },
      teacherAssignment: { findUnique: vi.fn(), create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await assignTeacher(db as never, actorUserId, {
      userId,
      gradeId,
      yearId,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_GROUP_INACTIVE,
      message: "admin.group.inactive",
    });
  });
});
