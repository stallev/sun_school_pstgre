import { describe, expect, it } from "vitest";
import { formatDeletionRequestedByLine } from "./format-deletion-requested-by-line";

const templates = {
  requestedBy: "Requested by: {name}",
  requestedByWithRole: "Requested by: {name} · {role}",
};

describe("formatDeletionRequestedByLine", () => {
  it("always includes requester display name for self requests", () => {
    expect(
      formatDeletionRequestedByLine(
        { requestedByDisplayName: "Ivanova Maria", requestedByRoleLabel: null },
        templates,
      ),
    ).toBe("Requested by: Ivanova Maria");
  });

  it("includes role when requester is not the subject", () => {
    expect(
      formatDeletionRequestedByLine(
        { requestedByDisplayName: "Petrova Anna", requestedByRoleLabel: "Parent" },
        templates,
      ),
    ).toBe("Requested by: Petrova Anna · Parent");
  });
});
