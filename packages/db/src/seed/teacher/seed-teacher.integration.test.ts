/**
 * Integration test of the dev-teacher seed on the DEV database. Cases that write run inside a
 * transaction that is rolled back, except the prod refusal (no write) and the lock race (cleaned up).
 * Skipped without APP_ENV=dev + DIRECT_URL.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../../client";
import type { PrismaClient } from "../../generated/prisma/client";
import { hashPassword, verifyPassword } from "../../auth/password";
import { TEACHER_SEED_ERROR, TeacherSeedFailure, seedTeacher, seedTeacherInTx } from "./index";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");

describe.skipIf(!enabled)("seedTeacherInTx on the dev database (rolled back)", () => {
  let prisma: PrismaClient;
  let hash: string;
  const email = "seed-teacher-test@example.invalid";

  const rolledBack = async <T>(body: (tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]) => Promise<T>) => {
    let result: T | undefined;
    await prisma
      .$transaction(async (tx) => {
        result = await body(tx);
        throw ROLLBACK;
      })
      .catch((error: unknown) => {
        if (error !== ROLLBACK) throw error;
      });
    return result as T;
  };

  beforeAll(async () => {
    prisma = createPrismaClient(process.env.DIRECT_URL ?? "");
    hash = await hashPassword("a-long-test-password");
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates ACTIVE + TEACHER + consent and the two audit records without secrets", async () => {
    const outcome = await rolledBack(async (tx) => {
      const report = await seedTeacherInTx(tx, { email, passwordHash: hash, resetPassword: false });
      const identity = await tx.loginIdentity.findUnique({
        where: { provider_providerAccountId: { provider: "CREDENTIALS", providerAccountId: email } },
      });
      const user = await tx.appUser.findUnique({
        where: { id: report.userId },
        include: { roles: true, consents: true },
      });
      const audits = await tx.auditLog.findMany({
        where: { entityId: { in: [report.userId, identity?.id ?? ""] } },
        orderBy: { occurredAt: "asc" },
      });
      return { report, identity, user, audits };
    });
    expect(outcome.report.created).toBe(true);
    expect(outcome.user?.status).toBe("ACTIVE");
    expect(outcome.user?.roles.map((row) => row.role)).toEqual(["TEACHER"]);
    expect(outcome.user?.consents.map((row) => row.type)).toEqual(["PD_PROCESSING"]);
    expect(await verifyPassword("a-long-test-password", outcome.identity?.passwordHash ?? "")).toBe(true);
    expect(outcome.audits.map((row) => row.action).sort()).toEqual(["access.dev_teacher_created", "auth.password_set"]);
    const serialized = JSON.stringify(outcome.audits);
    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain("scrypt$");
  }, 60_000);

  it("is idempotent and resets only the hash with the flag", async () => {
    const outcome = await rolledBack(async (tx) => {
      const first = await seedTeacherInTx(tx, { email, passwordHash: hash, resetPassword: false });
      const auditsBefore = await tx.auditLog.count();
      const repeat = await seedTeacherInTx(tx, { email, passwordHash: hash, resetPassword: false });
      const auditsAfterRepeat = await tx.auditLog.count();
      const newHash = await hashPassword("another-long-password");
      const reset = await seedTeacherInTx(tx, { email, passwordHash: newHash, resetPassword: true });
      const stored = await tx.loginIdentity.findUnique({
        where: { provider_providerAccountId: { provider: "CREDENTIALS", providerAccountId: email } },
      });
      const auditsAfterReset = await tx.auditLog.count();
      const users = await tx.loginIdentity.count({ where: { providerAccountId: email } });
      return { first, repeat, reset, stored, auditsBefore, auditsAfterRepeat, auditsAfterReset, users };
    });
    expect(outcome.repeat).toEqual({ created: false, passwordReset: false, userId: outcome.first.userId });
    expect(outcome.auditsAfterRepeat).toBe(outcome.auditsBefore);
    expect(outcome.reset.passwordReset).toBe(true);
    expect(outcome.auditsAfterReset).toBe(outcome.auditsBefore + 1);
    expect(await verifyPassword("another-long-password", outcome.stored?.passwordHash ?? "")).toBe(true);
    expect(outcome.users).toBe(1);
  }, 60_000);

  it("refuses an email already used by another credentials identity", async () => {
    const outcome = await rolledBack(async (tx) => {
      const admin = await tx.loginIdentity.findFirst({
        where: { provider: "CREDENTIALS", user: { roles: { some: { role: "ADMIN" } } } },
      });
      const taken = admin?.providerAccountId ?? email;
      if (!admin) {
        await tx.loginIdentity.create({
          data: {
            user: {
              create: {
                organizationId: (await tx.organization.findFirstOrThrow()).id,
                status: "ACTIVE",
                roles: { create: { role: "ADMIN" } },
              },
            },
            provider: "CREDENTIALS",
            providerAccountId: taken,
            email: taken,
            passwordHash: hash,
          },
        });
      }
      return seedTeacherInTx(tx, { email: taken, passwordHash: hash, resetPassword: false }).catch(
        (error: unknown) => error,
      );
    });
    expect(outcome).toBeInstanceOf(TeacherSeedFailure);
    expect((outcome as TeacherSeedFailure).reason).toBe(TEACHER_SEED_ERROR.EMAIL_TAKEN);
  }, 60_000);

  it("refuses when consent_text_version is missing", async () => {
    const outcome = await rolledBack(async (tx) => {
      await tx.appSetting.deleteMany({ where: { key: "consent_text_version" } });
      return seedTeacherInTx(tx, { email, passwordHash: hash, resetPassword: false }).catch((error: unknown) => error);
    });
    expect(outcome).toBeInstanceOf(TeacherSeedFailure);
    expect((outcome as TeacherSeedFailure).reason).toBe(TEACHER_SEED_ERROR.NO_CONSENT_TEXT_VERSION);
  }, 60_000);

  it("refuses when APP_ENV is prod and writes nothing", async () => {
    const before = await prisma.appUser.count();
    const outcome = await seedTeacher(prisma, "prod", {
      email,
      password: "a-long-test-password",
      resetPassword: false,
    }).catch((error: unknown) => error);
    expect(outcome).toBeInstanceOf(TeacherSeedFailure);
    expect((outcome as TeacherSeedFailure).reason).toBe(TEACHER_SEED_ERROR.NOT_DEV);
    expect(await prisma.appUser.count()).toBe(before);
  }, 60_000);
});
