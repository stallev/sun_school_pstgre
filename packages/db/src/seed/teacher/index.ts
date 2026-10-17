import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  CONSENT_TYPE,
  LOGIN_PROVIDER,
  USER_ROLE,
} from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import { hashPassword } from "../../auth/password";
import { assertDbEnvironment } from "../../env-guard";
import type { PrismaClient } from "../../generated/prisma/client";
import type { SeedTx } from "../reference/types";

/**
 * `db:seed:teacher` — one dev teacher for email sign-in (ADR-003 v1.3).
 * `ACTIVE` + role `TEACHER` + CREDENTIALS (scrypt) + `privacy_consent` for the current
 * `consent_text_version`, so the session opens `/today` instead of the consent screen.
 * Dev only. Idempotent: a repeat writes nothing; `--reset-password` replaces the hash only.
 * The password, the hash and the email never reach the audit values (INV-23).
 * A group and a school year are not created.
 */
const TEACHER_SEED_LOCK_KEY = "7340125503";
const CONSENT_TEXT_VERSION_KEY = "consent_text_version";

/** Fixture display name — not read from secrets. */
const DEV_TEACHER_LAST_NAME = "Фикстура";
const DEV_TEACHER_FIRST_NAME = "Учитель";

export const TEACHER_SEED_ERROR = {
  NOT_DEV: "NOT_DEV",
  NO_ORGANIZATION: "NO_ORGANIZATION",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  NO_CONSENT_TEXT_VERSION: "NO_CONSENT_TEXT_VERSION",
} as const;
export type TeacherSeedError = (typeof TEACHER_SEED_ERROR)[keyof typeof TEACHER_SEED_ERROR];

export class TeacherSeedFailure extends Error {
  readonly reason: TeacherSeedError;

  constructor(reason: TeacherSeedError, message: string) {
    super(message);
    this.name = "TeacherSeedFailure";
    this.reason = reason;
  }
}

export type TeacherSeedReport = {
  created: boolean;
  passwordReset: boolean;
  userId: string;
};

type TeacherSeedCore = { email: string; passwordHash: string; resetPassword: boolean };

async function readConsentTextVersion(tx: SeedTx): Promise<string> {
  const row = await tx.appSetting.findUnique({ where: { key: CONSENT_TEXT_VERSION_KEY } });
  if (typeof row?.value !== "string" || row.value.length === 0) {
    throw new TeacherSeedFailure(
      TEACHER_SEED_ERROR.NO_CONSENT_TEXT_VERSION,
      "No consent_text_version: run db:seed:reference first",
    );
  }
  return row.value;
}

/** The transactional core, separate from the lock/guard wrapper so tests can roll it back. */
export async function seedTeacherInTx(tx: SeedTx, input: TeacherSeedCore): Promise<TeacherSeedReport> {
  const existing = await tx.loginIdentity.findUnique({
    where: { provider_providerAccountId: { provider: LOGIN_PROVIDER.CREDENTIALS, providerAccountId: input.email } },
    include: { user: { include: { roles: true } } },
  });

  if (existing) {
    const roles = existing.user.roles.map((row) => row.role);
    const isDevTeacher = roles.includes(USER_ROLE.TEACHER) && !roles.includes(USER_ROLE.ADMIN);
    if (!isDevTeacher) {
      throw new TeacherSeedFailure(
        TEACHER_SEED_ERROR.EMAIL_TAKEN,
        "This email already belongs to another credentials identity",
      );
    }
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

  const organization = await tx.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) {
    throw new TeacherSeedFailure(TEACHER_SEED_ERROR.NO_ORGANIZATION, "No organization: run db:seed:reference first");
  }
  const textVersion = await readConsentTextVersion(tx);
  const now = new Date();
  const user = await tx.appUser.create({
    data: {
      organizationId: organization.id,
      status: ACCOUNT_STATUS.ACTIVE,
      email: input.email,
      lastName: DEV_TEACHER_LAST_NAME,
      firstName: DEV_TEACHER_FIRST_NAME,
      firstLoginAt: now,
      roles: { create: { role: USER_ROLE.TEACHER } },
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
  await tx.privacyConsent.create({
    data: {
      userId: user.id,
      textVersion,
      acceptedAt: now,
      type: CONSENT_TYPE.PD_PROCESSING,
    },
  });
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.APP_USER,
    entityId: user.id,
    action: AUDIT_ACTION.ACCESS_DEV_TEACHER_CREATED,
    newValue: { status: ACCOUNT_STATUS.ACTIVE, roles: [USER_ROLE.TEACHER] },
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

/** Refuses unless `APP_ENV` is dev, then lock + marker guard + core. A prod marker still refuses. */
export async function seedTeacher(
  prisma: PrismaClient,
  appEnv: string | undefined,
  input: { email: string; password: string; resetPassword: boolean },
): Promise<TeacherSeedReport> {
  if (appEnv !== "dev") {
    throw new TeacherSeedFailure(TEACHER_SEED_ERROR.NOT_DEV, "db:seed:teacher runs only when APP_ENV=dev");
  }
  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${TEACHER_SEED_LOCK_KEY})`);
      await assertDbEnvironment(tx, appEnv, { allowMarkerWrite: false });
      return seedTeacherInTx(tx, { email: input.email, passwordHash, resetPassword: input.resetPassword });
    },
    { maxWait: 20_000, timeout: 60_000 },
  );
}
