import { describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { assertBricksReadAccess } from "./bricks-shared.server";

const orgId = "22222222-2222-4222-8222-222222222222";
const actorTeacherId = "33333333-3333-4333-8333-333333333333";
const pupilId = "88888888-8888-4888-8888-888888888888";
const yearId = "55555555-5555-4555-8555-555555555555";

describe("assertBricksReadAccess teacher scope", () => {
  it("allows teacher assigned to pupil grade in year", async () => {
    const tx = {
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: "ACTIVE",
          organizationId: orgId,
          startsOn: new Date("2026-09-01"),
          endsOn: new Date("2027-06-01"),
        }),
      },
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
      },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appUser: {
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
      },
      teacherAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "assign-1" }),
      },
    };

    const result = await assertBricksReadAccess(
      tx as never,
      actorTeacherId,
      orgId,
      pupilId,
      yearId,
    );
    expect(result).toBeNull();
  });

  it("returns NOT_FOUND when teacher is not assigned to pupil grade", async () => {
    const tx = {
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: "ACTIVE",
          organizationId: orgId,
          startsOn: new Date("2026-09-01"),
          endsOn: new Date("2027-06-01"),
        }),
      },
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
      },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      appUser: {
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
      },
      teacherAssignment: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    const result = await assertBricksReadAccess(
      tx as never,
      actorTeacherId,
      orgId,
      pupilId,
      yearId,
    );
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });
});
