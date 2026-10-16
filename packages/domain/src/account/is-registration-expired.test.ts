import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS } from "../constants/account-status";
import { isRegistrationExpired } from "./is-registration-expired";

const NOW = new Date("2026-10-16T00:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe("isRegistrationExpired (INV-25)", () => {
  it("expires a REGISTRATION older than 30 days", () => {
    expect(isRegistrationExpired({ status: ACCOUNT_STATUS.REGISTRATION, firstLoginAt: daysAgo(31) }, NOW)).toBe(true);
  });

  it("keeps a fresh or exactly-30-day-old REGISTRATION", () => {
    expect(isRegistrationExpired({ status: ACCOUNT_STATUS.REGISTRATION, firstLoginAt: daysAgo(30) }, NOW)).toBe(false);
    expect(isRegistrationExpired({ status: ACCOUNT_STATUS.REGISTRATION, firstLoginAt: daysAgo(1) }, NOW)).toBe(false);
  });

  it("never expires other statuses or an unknown first login", () => {
    expect(isRegistrationExpired({ status: ACCOUNT_STATUS.REQUEST_PENDING, firstLoginAt: daysAgo(90) }, NOW)).toBe(false);
    expect(isRegistrationExpired({ status: ACCOUNT_STATUS.ACTIVE, firstLoginAt: daysAgo(90) }, NOW)).toBe(false);
    expect(isRegistrationExpired({ status: ACCOUNT_STATUS.REGISTRATION, firstLoginAt: null }, NOW)).toBe(false);
  });
});
