import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { writeAudit } from "@sunschool/db";
import { updatePupilBirthDateInTransaction } from "./update-pupil-birth-date";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const pupilId = "44444444-4444-4444-8444-444444444444";
const gradeId = "55555555-5555-4555-8555-555555555555";
const yearId = "66666666-6666-4666-8666-666666666666";

function mockTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({
        id: actorUserId,
        status: "ACTIVE",
        roles: [{ role: USER_ROLE.TEACHER }],
      }),
    },
    pupil: {
      findFirst: vi.fn().mockResolvedValue({
        id: pupilId,
        birthDate: new Date("2015-01-10T00:00:00.000Z"),
      }),
      update: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: yearId,
        status: ACADEMIC_YEAR_STATUS.ACTIVE,
      }),
    },
    enrollment: {
      findFirst: vi.fn().mockResolvedValue({ gradeId }),
    },
    teacherAssignment: {
      findFirst: vi.fn().mockResolvedValue({ id: "assign-1" }),
    },
    ...overrides,
  };
}

describe("updatePupilBirthDateInTransaction", () => {
  beforeEach(() => {
    vi.mocked(writeAudit).mockClear();
  });

  it("writes birth-date audit when the date changes", async () => {
    const tx = mockTx();
    const result = await updatePupilBirthDateInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { pupilId, birthDate: "2014-06-01" },
      "2026-11-03",
    );

    expect(result).toEqual({ ok: true });
    expect(tx.pupil.update).toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.SCHOOL_PUPIL_BIRTHDATE_UPDATED,
        newValue: { fields: ["birthDate"] },
      }),
    );
  });

  it("skips audit when the date is unchanged", async () => {
    const tx = mockTx();
    const result = await updatePupilBirthDateInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { pupilId, birthDate: "2015-01-10" },
      "2026-11-03",
    );

    expect(result).toEqual({ ok: true });
    expect(tx.pupil.update).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("returns VALIDATION when the date is in the future", async () => {
    const tx = mockTx();
    const result = await updatePupilBirthDateInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { pupilId, birthDate: "2026-11-03" },
      "2026-11-03",
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "common.errors.birth_date_in_future",
      fields: { birthDate: "common.errors.birth_date_in_future" },
    });
  });

  it("returns FORBIDDEN with year_closed when there is no active year", async () => {
    const tx = mockTx({
      academicYear: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const result = await updatePupilBirthDateInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { pupilId, birthDate: "2014-06-01" },
      "2026-11-03",
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.year_closed",
    });
  });

  it("returns NOT_FOUND when teacher is not assigned to the pupil group", async () => {
    const tx = mockTx({
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const result = await updatePupilBirthDateInTransaction(
      tx as never,
      actorUserId,
      orgId,
      { pupilId, birthDate: "2014-06-01" },
      "2026-11-03",
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });
});
