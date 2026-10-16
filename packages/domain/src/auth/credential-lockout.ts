/**
 * Brute-force protection of the administrator's password sign-in (ADR-003 v1.1 §4.1,
 * auth_runtime_spec §4.4): 5 failures in a row lock the identity for 15 minutes.
 * Pure: the clock is an input (no `Date.now()` here).
 */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_MINUTES = 15;

export type LockoutState = {
  failedAttempts: number;
  lockedUntil: Date | null;
};

/** True while `lockedUntil` is in the future. */
export const isLocked = (lockedUntil: Date | null, now: Date): boolean =>
  lockedUntil !== null && lockedUntil.getTime() > now.getTime();

/** State after one more failed attempt: the 5th failure locks and resets the counter. */
export const registerFailedLogin = (state: LockoutState, now: Date): LockoutState => {
  const failedAttempts = state.failedAttempts + 1;
  if (failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    return { failedAttempts: 0, lockedUntil: new Date(now.getTime() + LOGIN_LOCK_MINUTES * 60_000) };
  }
  return { failedAttempts, lockedUntil: state.lockedUntil };
};

/** State after a successful sign-in. */
export const registerSuccessfulLogin = (): LockoutState => ({ failedAttempts: 0, lockedUntil: null });
