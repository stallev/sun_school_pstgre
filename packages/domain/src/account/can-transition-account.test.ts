import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, type AccountStatus } from "../constants/account-status";
import { canTransitionAccount } from "./can-transition-account";

const S = ACCOUNT_STATUS;

describe("canTransitionAccount (lifecycle §5.1)", () => {
  it.each([
    [S.REGISTRATION, S.REQUEST_PENDING],
    [S.REQUEST_PENDING, S.ACTIVE],
    [S.REQUEST_PENDING, S.REJECTED],
    [S.REJECTED, S.REQUEST_PENDING],
    [S.ACTIVE, S.DISABLED],
    [S.DISABLED, S.ACTIVE],
    [S.REGISTRATION, S.DELETED],
    [S.ACTIVE, S.DELETED],
  ])("allows %s → %s", (from, to) => {
    expect(canTransitionAccount(from, to)).toBe(true);
  });

  it.each([
    [S.REGISTRATION, S.ACTIVE],
    [S.ACTIVE, S.REGISTRATION],
    [S.REJECTED, S.ACTIVE],
    [S.DISABLED, S.REJECTED],
    [S.REQUEST_PENDING, S.REQUEST_PENDING],
  ])("forbids %s → %s", (from, to) => {
    expect(canTransitionAccount(from, to)).toBe(false);
  });

  it("allows nothing out of DELETED", () => {
    for (const to of Object.values(S) as AccountStatus[]) {
      expect(canTransitionAccount(S.DELETED, to)).toBe(false);
    }
  });
});
