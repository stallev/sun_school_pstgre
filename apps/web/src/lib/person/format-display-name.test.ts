import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS } from "@sunschool/domain";
import { formatAppUserDisplayName, formatDeletedUserLabel } from "./format-display-name";

describe("deleted user display label", () => {
  it("renders «Удалённый пользователь №N» from the dictionary template", () => {
    expect(formatDeletedUserLabel(7, "Удалённый пользователь №{ordinal}")).toBe(
      "Удалённый пользователь №7",
    );
  });

  it("uses deleted label instead of cleared name parts", () => {
    const label = formatAppUserDisplayName(
      {
        status: ACCOUNT_STATUS.DELETED,
        deletedOrdinal: 3,
        lastName: null,
        firstName: null,
        middleName: null,
      },
      "Удалённый пользователь №{ordinal}",
    );
    expect(label).toBe("Удалённый пользователь №3");
  });
});
