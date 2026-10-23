import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  ADULT_RELATION,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { ensureWeeklyDigestInTransaction } from "./ensure-weekly-digest";
import { listFamilyContactsInTransaction } from "./list-family-contacts";
import { loadFamilyForAdminPageInTransaction } from "./load-family-for-admin.server";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const teacherUserId = "11111111-1111-4111-8111-111111111111";
const adminUserId = "22222222-2222-4222-8222-222222222222";
const parentUserId = "55555555-5555-4555-8555-555555555555";
const pupilId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const familyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgId = "33333333-3333-4333-8333-333333333333";
const digestId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const now = new Date("2026-10-23T12:00:00.000Z");

function baseTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn(),
    },
    appSetting: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        if (where.key === "features.parents") return { value: true };
        if (where.key === "school_timezone") return { value: "Europe/Moscow" };
        return null;
      }),
    },
    pupil: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([{ id: pupilId }]),
    },
    familyAdult: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    family: {
      findFirst: vi.fn(),
    },
    enrollment: { findMany: vi.fn().mockResolvedValue([]) },
    userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    teacherAssignment: { findFirst: vi.fn().mockResolvedValue({ id: "ta-1" }) },
    achievementAward: { findMany: vi.fn().mockResolvedValue([]) },
    penalty: { findMany: vi.fn().mockResolvedValue([]) },
    homeworkCheck: { findMany: vi.fn().mockResolvedValue([]) },
    weeklyDigest: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    ...overrides,
  };
}

describe("listFamilyContacts (families §6.5, AZ-63)", () => {
  it("returns teacher-safe contacts without email for a reachable pupil", async () => {
    const tx = baseTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: teacherUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId, familyId }),
      },
      familyAdult: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "adult-1",
            lastName: "Иванова",
            firstName: "Мария",
            middleName: null,
            relation: ADULT_RELATION.MOTHER,
            phones: ["+79001234567"],
            email: "hidden@example.com",
          },
        ]),
      },
      enrollment: {
        findMany: vi.fn().mockResolvedValue([{ gradeId: "g1", academicYearId: "y1" }]),
      },
    });

    const result = await listFamilyContactsInTransaction(tx as never, teacherUserId, orgId, pupilId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.adults[0]).toMatchObject({
      firstName: "Мария",
      phones: ["+79001234567"],
    });
    expect(result.data.adults[0]).not.toHaveProperty("email");
    expect(result.data.adults[0]).not.toHaveProperty("address");
  });

  it("returns NOT_FOUND for a pupil outside the teacher scope", async () => {
    const tx = baseTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: teacherUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      pupil: { findFirst: vi.fn().mockResolvedValue({ id: pupilId, familyId }) },
      teacherAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      enrollment: {
        findMany: vi.fn().mockResolvedValue([{ gradeId: "g1", academicYearId: "y1" }]),
      },
    });

    const result = await listFamilyContactsInTransaction(tx as never, teacherUserId, orgId, pupilId);
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });
});

describe("loadFamilyForAdminPage (admin address on /family)", () => {
  it("returns address and note for admin", async () => {
    const tx = baseTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: adminUserId,
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.ADMIN }],
        }),
      },
      family: {
        findFirst: vi.fn().mockResolvedValue({
          id: familyId,
          name: "Ивановы",
          address: "ул. Примерная, 1",
          note: "звонить вечером",
        }),
      },
    });

    const result = await loadFamilyForAdminPageInTransaction(tx as never, adminUserId, orgId, familyId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.address).toBe("ул. Примерная, 1");
    expect(result.data.note).toBe("звонить вечером");
  });
});

describe("ensureWeeklyDigest (families §6.6, AZ-64, INV-25)", () => {
  it("creates one row per week with empty sent_at", async () => {
    const create = vi.fn().mockResolvedValue({
      id: digestId,
      periodStart: new Date("2026-10-19T00:00:00.000Z"),
      payload: { awardIds: [], penaltyIds: [], lateCheckIds: [] },
      sentAt: null,
    });
    const tx = baseTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.PARENT }],
        }),
      },
      familyAdult: {
        findMany: vi.fn().mockResolvedValue([{ familyId }]),
      },
      weeklyDigest: {
        findFirst: vi.fn().mockResolvedValue(null),
        create,
      },
    });

    const result = await ensureWeeklyDigestInTransaction(
      tx as never,
      parentUserId,
      orgId,
      now,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.sentAt).toBeNull();
    expect(result.data.periodStart).toBe("2026-10-19");
    expect(create).toHaveBeenCalledOnce();
    const createArgs = create.mock.calls[0]?.[0] as { data: { sentAt: null } };
    expect(createArgs.data.sentAt).toBeNull();
  });

  it("reads the existing row on repeat within the same week", async () => {
    const existing = {
      id: digestId,
      periodStart: new Date("2026-10-19T00:00:00.000Z"),
      payload: { awardIds: ["a1"], penaltyIds: [], lateCheckIds: [] },
      sentAt: null,
    };
    const tx = baseTx({
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          status: ACCOUNT_STATUS.ACTIVE,
          roles: [{ role: USER_ROLE.PARENT }],
        }),
      },
      weeklyDigest: {
        findFirst: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
      },
    });

    const result = await ensureWeeklyDigestInTransaction(
      tx as never,
      parentUserId,
      orgId,
      now,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.digestId).toBe(digestId);
    expect(tx.weeklyDigest.create).not.toHaveBeenCalled();
  });
});
