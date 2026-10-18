import { describe, expect, it, vi } from "vitest";
import { ACCOUNT_STATUS } from "@sunschool/domain";

const scrubAuditLogForUserPrivileged = vi.hoisted(() => vi.fn().mockResolvedValue(1));

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, scrubAuditLogForUserPrivileged };
});

import { anonymizeUserInTransaction } from "./anonymize-user";

const userId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";

describe("anonymizeUserInTransaction (deletion_requests §6.1)", () => {
  it("clears identities, roles, assignments, names and assigns deleted ordinal", async () => {
    const tx = {
      loginIdentity: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      userRoleAssignment: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      teacherAssignment: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      accessRequest: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      appUser: {
        aggregate: vi.fn().mockResolvedValue({ _max: { deletedOrdinal: 4 } }),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    const result = await anonymizeUserInTransaction(tx as never, userId, orgId);

    expect(result).toEqual({ deletedOrdinal: 5 });
    expect(tx.loginIdentity.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.userRoleAssignment.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.teacherAssignment.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.accessRequest.updateMany).toHaveBeenCalledWith({
      where: { userId },
      data: { fullNameSnapshot: "" },
    });
    expect(tx.appUser.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        lastName: null,
        firstName: null,
        middleName: null,
        email: null,
        status: ACCOUNT_STATUS.DELETED,
        deletedOrdinal: 5,
      },
    });
    expect(scrubAuditLogForUserPrivileged).toHaveBeenCalledWith(tx, userId);
  });
});
