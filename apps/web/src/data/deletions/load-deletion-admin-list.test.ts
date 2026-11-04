import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import {
  isDeletionRequestedBySubject,
  resolveDeletionRequesterDisplayName,
  resolveDeletionRequesterRoleLabel,
  sortDeletionRowsByDue,
  type DeletionAdminRow,
} from "./load-deletion-admin-list.server";

const labels = {
  deletedUserTemplate: "Deleted user #{ordinal}",
  requesterNameFallback: "User without a name",
  roleAdmin: "Administrator",
  roleTeacher: "Teacher",
  roleParent: "Parent",
};

describe("resolveDeletionRequesterDisplayName", () => {
  it("uses fallback when name is empty", () => {
    expect(
      resolveDeletionRequesterDisplayName(
        {
          firstName: "",
          lastName: "",
          middleName: "",
          status: ACCOUNT_STATUS.ACTIVE,
          deletedOrdinal: null,
        },
        labels,
      ),
    ).toEqual({ displayName: labels.requesterNameFallback, usedFallback: true });
  });
});

describe("resolveDeletionRequesterRoleLabel", () => {
  it("returns parent role for child-data requests without subject user", () => {
    expect(
      resolveDeletionRequesterRoleLabel(
        "parent-user-id",
        null,
        [{ role: USER_ROLE.PARENT }],
        labels,
      ),
    ).toBe(labels.roleParent);
  });

  it("returns null when requester is the account subject", () => {
    expect(
      resolveDeletionRequesterRoleLabel(
        "same-user",
        "same-user",
        [{ role: USER_ROLE.TEACHER }],
        labels,
      ),
    ).toBeNull();
  });
});

describe("isDeletionRequestedBySubject", () => {
  it("is false when subject user id is empty", () => {
    expect(isDeletionRequestedBySubject("parent-user-id", null)).toBe(false);
  });
});

describe("sortDeletionRowsByDue", () => {
  it("orders earliest due date first", () => {
    const rows = [
      { dueOnIso: "2026-11-10", requestedAtIso: "2026-11-01T10:00:00.000Z" },
      { dueOnIso: "2026-11-03", requestedAtIso: "2026-11-01T11:00:00.000Z" },
    ] as DeletionAdminRow[];

    const sorted = sortDeletionRowsByDue(rows);
    expect(sorted[0]?.dueOnIso).toBe("2026-11-03");
  });
});
