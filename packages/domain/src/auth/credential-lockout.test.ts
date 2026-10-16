import { describe, expect, it } from "vitest";
import {
  isLocked,
  LOGIN_LOCK_MINUTES,
  registerFailedLogin,
  registerSuccessfulLogin,
  type LockoutState,
} from "./credential-lockout";

const NOW = new Date("2026-10-16T10:00:00.000Z");

describe("credential lockout (5 failures → 15 minutes)", () => {
  it("counts failures without locking before the fifth", () => {
    let state: LockoutState = { failedAttempts: 0, lockedUntil: null };
    for (let i = 1; i <= 4; i += 1) {
      state = registerFailedLogin(state, NOW);
      expect(state).toEqual({ failedAttempts: i, lockedUntil: null });
    }
  });

  it("locks on the fifth failure and resets the counter", () => {
    const state = registerFailedLogin({ failedAttempts: 4, lockedUntil: null }, NOW);
    expect(state.failedAttempts).toBe(0);
    expect(state.lockedUntil?.toISOString()).toBe(
      new Date(NOW.getTime() + LOGIN_LOCK_MINUTES * 60_000).toISOString(),
    );
  });

  it("isLocked is true only while the lock is in the future", () => {
    const until = new Date(NOW.getTime() + 60_000);
    expect(isLocked(until, NOW)).toBe(true);
    expect(isLocked(until, new Date(until.getTime()))).toBe(false);
    expect(isLocked(null, NOW)).toBe(false);
  });

  it("a successful login clears the state", () => {
    expect(registerSuccessfulLogin()).toEqual({ failedAttempts: 0, lockedUntil: null });
  });
});
