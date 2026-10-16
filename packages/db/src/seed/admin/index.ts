import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE, ACCOUNT_STATUS, LOGIN_PROVIDER, USER_ROLE } from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import { hashPassword } from "../../auth/password";
import { assertDbEnvironment } from "../../env-guard";
import type { PrismaClient } from "../../generated/prisma/client";
import type { SeedTx } from "../reference/types";

/**
 * `db:seed:admin` — the first administrator (ADR-003 v1.1 §4.4, seed_data_spec §4 set C,
 * access_requests §5.1): `ACTIVE` user + role `ADMIN` + a CREDENTIALS identity (email + scrypt hash).
 * Idempotent: a repeat changes nothing and writes no audit record (L-6); `--reset-password` only
 * replaces the hash. The password, the hash and the email never reach the audit values (INV-23).
 */
const ADMIN_SEED_LOCK_KEY = "7340125502";

export const ADMIN_SEED_ERROR = {
  NO_ORGANIZATION: "NO_ORGANIZATION",
  ANOTHER_ADMIN_EXISTS: "ANOTHER_ADMIN_EXISTS",
} as const;
export type AdminSeedError = (typeof ADMIN_SEED_ERROR)[keyof typeof ADMIN_SEED_ERROR];

export class AdminSeedFailure extends Error {
  readonly reason: AdminSeedError;

  constructor(reason: AdminSeedError, message: string) {
    super(message);
    this.name = "AdminSeedFailure";
    this.reason = reason;
  }
}

export type AdminSeedReport = {
  /** The administrator did not exist and was created. */
  created: boolean;
  /** An existing administrator got a new password (`--reset-password`). */
  passwordReset: boolean;
  userId: string;
};

type AdminSeedCore = { email: string; passwordHash: string; resetPassword: boolean };

/** The transactional core, separate from the lock/guard wrapper so tests can run it with a rollback. */
export async function seedAdminInTx(tx: SeedTx, input: AdminSeedCore): Promise<AdminSeedReport> {
  const existing = await tx.loginIdentity.findUnique({
    where: { provider_providerAccountId: { provider: LOGIN_PROVIDER.CREDENTIALS, providerAccountId: input.email } },
  });

  if (existing) {
    if (!input.resetPassword) return { created: false, passwordReset: false, userId: existing.userId };
    await tx.loginIdentity.update({
      where: { id: existing.id },
      data: { passwordHash: input.passwordHash, failedAttempts: 0, lockedUntil: null },
    });
    await writeAudit(tx, {
      actorUserId: null,
      source: AUDIT_SOURCE.SYSTEM,
      entityType: AUDIT_ENTITY_TYPE.LOGIN_IDENTITY,
      entityId: existing.id,
      action: AUDIT_ACTION.AUTH_PASSWORD_SET,
    });
    return { created: false, passwordReset: true, userId: existing.userId };
  }

  const otherAdmin = await tx.userRoleAssignment.findFirst({ where: { role: USER_ROLE.ADMIN } });
  if (otherAdmin) {
    throw new AdminSeedFailure(
      ADMIN_SEED_ERROR.ANOTHER_ADMIN_EXISTS,
      "An administrator already exists under another email; use --reset-password with that email",
    );
  }
  const organization = await tx.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) {
    throw new AdminSeedFailure(ADMIN_SEED_ERROR.NO_ORGANIZATION, "No organization: run db:seed:reference first");
  }

  const now = new Date();
  const user = await tx.appUser.create({
    data: {
      organizationId: organization.id,
      status: ACCOUNT_STATUS.ACTIVE,
      email: input.email,
      firstLoginAt: now,
      roles: { create: { role: USER_ROLE.ADMIN } },
    },
  });
  const identity = await tx.loginIdentity.create({
    data: {
      userId: user.id,
      provider: LOGIN_PROVIDER.CREDENTIALS,
      providerAccountId: input.email,
      email: input.email,
      passwordHash: input.passwordHash,
    },
  });
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.APP_USER,
    entityId: user.id,
    action: AUDIT_ACTION.ACCESS_FIRST_ADMIN_CREATED,
    newValue: { status: ACCOUNT_STATUS.ACTIVE, roles: [USER_ROLE.ADMIN] },
  });
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.LOGIN_IDENTITY,
    entityId: identity.id,
    action: AUDIT_ACTION.AUTH_PASSWORD_SET,
  });
  return { created: true, passwordReset: false, userId: user.id };
}

/** Lock + environment guard + core in one transaction. Two parallel runs serialize on the lock. */
export async function seedAdmin(
  prisma: PrismaClient,
  appEnv: string | undefined,
  input: { email: string; password: string; resetPassword: boolean },
): Promise<AdminSeedReport> {
  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${ADMIN_SEED_LOCK_KEY})`);
      await assertDbEnvironment(tx, appEnv, { allowMarkerWrite: false });
      return seedAdminInTx(tx, { email: input.email, passwordHash, resetPassword: input.resetPassword });
    },
    { maxWait: 20_000, timeout: 60_000 },
  );
}
