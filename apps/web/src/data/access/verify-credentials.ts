import "server-only";
import {
  ACCOUNT_STATUS,
  credentialsLoginSchema,
  isLocked,
  LOGIN_PROVIDER,
  registerFailedLogin,
} from "@sunschool/domain";
import { getDummyPasswordHash, verifyPassword, type PrismaClient } from "@sunschool/db";

/**
 * Logic of the Credentials `authorize()` (auth_runtime_spec §4.4, ADR-003 v1.1 §4.1). Only an
 * administrator has a CREDENTIALS identity, so a teacher cannot sign in by password.
 * - a wrong email and a wrong password look identical (`bad_credentials`) and cost the same time
 *   (a dummy hash is verified for an unknown email);
 * - 5 failures in a row lock the identity for 15 minutes (`locked`);
 * - `DISABLED` / `DELETED` are refused like a bad login, before the compare, without touching the counter.
 * The password and the hash are never logged or returned.
 */
export type CredentialsFailure = "bad_credentials" | "locked";

export type CredentialsResult = { ok: true; uid: string } | { ok: false; reason: CredentialsFailure };

type Db = Pick<PrismaClient, "loginIdentity" | "appUser">;

export async function verifyCredentials(db: Db, raw: unknown, now: Date): Promise<CredentialsResult> {
  const parsed = credentialsLoginSchema.safeParse(raw);
  if (!parsed.success) {
    await verifyPassword("x", await getDummyPasswordHash());
    return { ok: false, reason: "bad_credentials" };
  }
  const { email, password } = parsed.data;

  const identity = await db.loginIdentity.findUnique({
    where: { provider_providerAccountId: { provider: LOGIN_PROVIDER.CREDENTIALS, providerAccountId: email } },
    include: { user: { select: { id: true, status: true, firstLoginAt: true } } },
  });
  if (!identity?.passwordHash) {
    await verifyPassword(password, await getDummyPasswordHash());
    return { ok: false, reason: "bad_credentials" };
  }
  if (isLocked(identity.lockedUntil, now)) return { ok: false, reason: "locked" };

  // §4.4 step 3: a disabled / deleted administrator is refused like a bad login (same time, counter untouched).
  const { status } = identity.user;
  if (status === ACCOUNT_STATUS.DISABLED || status === ACCOUNT_STATUS.DELETED) {
    await verifyPassword(password, await getDummyPasswordHash());
    return { ok: false, reason: "bad_credentials" };
  }

  if (!(await verifyPassword(password, identity.passwordHash))) {
    // Atomic increment first, then the pure rule decides whether this was the locking failure.
    const updated = await db.loginIdentity.update({
      where: { id: identity.id },
      data: { failedAttempts: { increment: 1 } },
    });
    const next = registerFailedLogin(
      { failedAttempts: updated.failedAttempts - 1, lockedUntil: updated.lockedUntil },
      now,
    );
    // This failure is the locking one: the lock was not active before and is active now.
    if (isLocked(next.lockedUntil, now) && !isLocked(updated.lockedUntil, now)) {
      await db.loginIdentity.update({
        where: { id: identity.id },
        data: { failedAttempts: next.failedAttempts, lockedUntil: next.lockedUntil },
      });
      return { ok: false, reason: "locked" };
    }
    return { ok: false, reason: "bad_credentials" };
  }

  if (identity.failedAttempts !== 0 || identity.lockedUntil !== null) {
    await db.loginIdentity.update({ where: { id: identity.id }, data: { failedAttempts: 0, lockedUntil: null } });
  }
  await db.appUser.update({
    where: { id: identity.user.id },
    data: { lastLoginAt: now, firstLoginAt: identity.user.firstLoginAt ?? now },
  });
  return { ok: true, uid: identity.user.id };
}
