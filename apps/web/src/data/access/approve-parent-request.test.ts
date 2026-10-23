import { describe, expect, it, vi } from "vitest";
import {
  ADULT_RELATION,
  MUTATION_ERROR_CODES,
  PARENT_APPROVAL_LINK_MODE,
} from "@sunschool/domain";
import { approveParentRequestInTransaction } from "./approve-parent-request";

const actorUserId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const organizationId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const approvedUserId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const pupilId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const adultId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const familyId = "ffffffff-ffff-4fff-8fff-ffffffffffff";

const approvedProfile = {
  id: approvedUserId,
  lastName: "Иванов",
  firstName: "Пётр",
  middleName: null,
  email: "p@example.com",
  organizationId,
};

function mockAppUserLookup() {
  return vi.fn(async ({ where }: { where: { id: string } }) => {
    if (where.id === approvedUserId) return approvedProfile;
    if (where.id === actorUserId) {
      return { id: actorUserId, status: "ACTIVE", roles: [{ role: "ADMIN" }] };
    }
    return null;
  });
}

describe("approveParentRequestInTransaction", () => {
  it("returns FAMILY_CHILD_HAS_FAMILY when create mode includes a pupil already in a family", async () => {
    const tx = {
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      appUser: { findUnique: mockAppUserLookup() },
      $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
      pupil: {
        findMany: vi.fn().mockResolvedValue([{ id: pupilId, familyId }]),
      },
    };

    const result = await approveParentRequestInTransaction(
      tx as never,
      actorUserId,
      organizationId,
      approvedUserId,
      {
        mode: PARENT_APPROVAL_LINK_MODE.CREATE_FAMILY,
        pupilIds: [pupilId],
        relation: ADULT_RELATION.FATHER,
      },
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FAMILY_CHILD_HAS_FAMILY,
      message: "admin.family.child_taken",
    });
  });

  it("links an adult without an account to the approved user", async () => {
    const update = vi.fn();
    const tx = {
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: true }) },
      appUser: { findUnique: mockAppUserLookup() },
      familyAdult: {
        findUnique: vi.fn().mockResolvedValue({
          id: adultId,
          userId: null,
          email: null,
          familyId,
          family: { organizationId },
        }),
        update,
      },
      family: { findFirst: vi.fn().mockResolvedValue({ id: familyId }) },
      auditLog: { create: vi.fn() },
    };

    const result = await approveParentRequestInTransaction(
      tx as never,
      actorUserId,
      organizationId,
      approvedUserId,
      {
        mode: PARENT_APPROVAL_LINK_MODE.LINK_EXISTING_ADULT,
        adultId,
      },
    );

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: adultId },
      data: { userId: approvedUserId, email: "p@example.com" },
    });
  });
});
