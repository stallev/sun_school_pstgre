import { describe, expect, it } from "vitest";
import { formatDeletionRequestedByLine } from "@/lib/deletions/format-deletion-requested-by-line";

const templates = {
  requestedBy: "Requested by: {name}",
  requestedByWithRole: "Requested by: {name} · {role}",
  requestedByRoleEmail: "Requested by: {role} · {email}",
};

describe("formatDeletionRequestedByLine", () => {
  it("shows role and email when the requester name is missing", () => {
    expect(
      formatDeletionRequestedByLine(
        {
          requestedByDisplayName: "User without a name",
          requestedByRoleLabel: "Administrator",
          requestedByEmail: "admin@example.com",
          usedNameFallback: true,
        },
        templates,
      ),
    ).toBe("Requested by: Administrator · admin@example.com");
  });

  it("keeps named requester with role", () => {
    expect(
      formatDeletionRequestedByLine(
        {
          requestedByDisplayName: "Ivan Ivanov",
          requestedByRoleLabel: "Teacher",
          requestedByEmail: null,
          usedNameFallback: false,
        },
        templates,
      ),
    ).toBe("Requested by: Ivan Ivanov · Teacher");
  });
});
