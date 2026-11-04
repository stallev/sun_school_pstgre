import { USER_ROLE } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import {
  buildUserListDisambiguators,
  resolveUserListPrimaryName,
  type UserListDisplayInput,
} from "@/data/users/format-user-list-display";

const labels = {
  unnamed: "Unnamed",
  adminWithoutName: "Administrator (no name)",
};

describe("resolveUserListPrimaryName", () => {
  it("uses admin without name label for empty admin", () => {
    expect(
      resolveUserListPrimaryName(
        { displayName: "  ", roles: [USER_ROLE.ADMIN] },
        labels,
      ),
    ).toBe(labels.adminWithoutName);
  });
});

describe("buildUserListDisambiguators", () => {
  it("adds email for duplicate names", () => {
    const messages = {
      users: { unnamed: labels.unnamed },
      approvals: { roleAdmin: "Admin", roleTeacher: "Teacher" },
    } as Parameters<typeof buildUserListDisambiguators>[1];

    const rows: UserListDisplayInput[] = [
      { userId: "a", displayName: "Same Name", contactEmail: "a@example.com", roles: [] },
      { userId: "b", displayName: "Same Name", contactEmail: "b@example.com", roles: [] },
    ];

    const map = buildUserListDisambiguators(rows, messages, labels);
    expect(map.get("a")).toBe("a@example.com");
    expect(map.get("b")).toBe("b@example.com");
  });

  it("skips disambiguator for unique names", () => {
    const messages = {
      users: { unnamed: labels.unnamed },
      approvals: { roleAdmin: "Admin", roleTeacher: "Teacher" },
    } as Parameters<typeof buildUserListDisambiguators>[1];

    const map = buildUserListDisambiguators(
      [{ userId: "a", displayName: "Unique", contactEmail: "a@example.com", roles: [] }],
      messages,
      labels,
    );
    expect(map.get("a")).toBeNull();
  });
});
