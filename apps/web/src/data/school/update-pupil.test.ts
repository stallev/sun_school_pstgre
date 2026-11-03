import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION } from "@sunschool/domain";
import { writeAudit } from "@sunschool/db";
import { updatePupilInTransaction } from "./update-pupil";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const pupilId = "44444444-4444-4444-8444-444444444444";

const baseInput = {
  pupilId,
  lastName: "Ivanov",
  firstName: "Ivan",
  middleName: undefined,
  birthDate: "2014-06-01",
  isActive: true,
};

const basePupil = {
  id: pupilId,
  isActive: true,
  birthDate: new Date("2015-01-10T00:00:00.000Z"),
  lastName: "Ivanov",
  firstName: "Ivan",
  middleName: null,
};

function mockTx(overrides: Record<string, unknown> = {}) {
  return {
    pupil: {
      findFirst: vi.fn().mockResolvedValue(basePupil),
      update: vi.fn(),
    },
    ...overrides,
  };
}

describe("updatePupilInTransaction birth date audit", () => {
  beforeEach(() => {
    vi.mocked(writeAudit).mockClear();
  });

  it("writes school.pupil_birth_date_updated when birthDate changes", async () => {
    const tx = mockTx();
    const result = await updatePupilInTransaction(tx as never, actorUserId, orgId, baseInput, "2026-11-03");

    expect(result).toEqual({ ok: true });
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.SCHOOL_PUPIL_BIRTHDATE_UPDATED,
        newValue: { fields: ["birthDate"] },
      }),
    );
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.SCHOOL_PUPIL_UPDATED,
        newValue: expect.objectContaining({ fields: expect.arrayContaining(["birthDate"]) }),
      }),
    );
  });
});
