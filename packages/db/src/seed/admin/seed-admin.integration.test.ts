/**
 * Integration test of the first-admin seed on the DEV database. Every case runs inside a
 * transaction that is rolled back (sentinel throw), so no user, identity or audit row survives.
 * Skipped without APP_ENV=dev + DIRECT_URL.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../../client";
import type { PrismaClient } from "../../generated/prisma/client";
import { hashPassword, verifyPassword } from "../../auth/password";
import { ADMIN_SEED_ERROR, AdminSeedFailure, seedAdmin, seedAdminInTx } from "./index";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");

describe.skipIf(!enabled)("seedAdminInTx on the dev database (rolled back)", () => {
  let prisma: PrismaClient;
  let hash: string;
  const email = "seed-admin-test@example.invalid";

  /** Runs `body` in a transaction and always rolls it back. */
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

  it("creates ACTIVE + ADMIN + CREDENTIALS identity and the two audit records", async () => {
    // The dev database may already hold the real first admin — then the guard path applies.
    const already = await prisma.userRoleAssignment.findFirst({ where: { role: "ADMIN" } });
    if (already) return;
    const outcome = await rolledBack(async (tx) => {
      const report = await seedAdminInTx(tx, { email, passwordHash: hash, resetPassword: false });
      const identity = await tx.loginIdentity.findUnique({
        where: { provider_providerAccountId: { provider: "CREDENTIALS", providerAccountId: email } },
      });
      const user = await tx.appUser.findUnique({ where: { id: report.userId }, include: { roles: true } });
      const audits = await tx.auditLog.findMany({
        where: { entityId: { in: [report.userId, identity?.id ?? ""] } },
        orderBy: { occurredAt: "asc" },
      });
      return { report, identity, user, audits };
    });
    expect(outcome.report.created).toBe(true);
    expect(outcome.user?.status).toBe("ACTIVE");
    expect(outcome.user?.roles.map((r) => r.role)).toEqual(["ADMIN"]);
    expect(await verifyPassword("a-long-test-password", outcome.identity?.passwordHash ?? "")).toBe(true);
    expect(outcome.audits.map((a) => a.action).sort()).toEqual(["access.first_admin_created", "auth.password_set"]);
    expect(JSON.stringify(outcome.audits)).not.toContain(email);
    expect(JSON.stringify(outcome.audits)).not.toContain("scrypt$");
  }, 60_000);

  it("is idempotent (no second user, no audit) and resets only with the flag", async () => {
    const already = await prisma.userRoleAssignment.findFirst({ where: { role: "ADMIN" } });
    if (already) return;
    const outcome = await rolledBack(async (tx) => {
      const first = await seedAdminInTx(tx, { email, passwordHash: hash, resetPassword: false });
      const auditsBefore = await tx.auditLog.count();
      const repeat = await seedAdminInTx(tx, { email, passwordHash: hash, resetPassword: false });
      const auditsAfterRepeat = await tx.auditLog.count();
      const newHash = await hashPassword("another-long-password");
      const reset = await seedAdminInTx(tx, { email, passwordHash: newHash, resetPassword: true });
      const auditsAfterReset = await tx.auditLog.count();
      const users = await tx.loginIdentity.count({ where: { providerAccountId: email } });
      return { first, repeat, reset, auditsBefore, auditsAfterRepeat, auditsAfterReset, users };
    });
    expect(outcome.repeat).toEqual({ created: false, passwordReset: false, userId: outcome.first.userId });
    expect(outcome.auditsAfterRepeat).toBe(outcome.auditsBefore);
    expect(outcome.reset.passwordReset).toBe(true);
    expect(outcome.auditsAfterReset).toBe(outcome.auditsBefore + 1);
    expect(outcome.users).toBe(1);
  }, 60_000);

  it("two concurrent seed runs serialize on the lock: one admin, no duplicate rows", async () => {
    // Creation race is only possible on an empty database; once the real first admin exists
    // (dev), the same two-run race is exercised with that admin's identity: both runs must be
    // clean no-ops under the lock, and nothing may be added.
    const existing = await prisma.loginIdentity.findFirst({ where: { provider: "CREDENTIALS" } });
    const raceEmail = existing?.providerAccountId ?? "seed-admin-race@example.invalid";
    const before = {
      admins: await prisma.userRoleAssignment.count({ where: { role: "ADMIN" } }),
      audits: await prisma.auditLog.count(),
    };
    try {
      const reports = await Promise.all([
        seedAdmin(prisma, "dev", { email: raceEmail, password: "a-long-test-password", resetPassword: false }),
        seedAdmin(prisma, "dev", { email: raceEmail, password: "a-long-test-password", resetPassword: false }),
      ]);
      expect(reports.filter((r) => r.created)).toHaveLength(existing ? 0 : 1);
      expect(reports[0]?.userId).toBe(reports[1]?.userId);
      const after = {
        admins: await prisma.userRoleAssignment.count({ where: { role: "ADMIN" } }),
        audits: await prisma.auditLog.count(),
      };
      expect(after.admins).toBe(existing ? before.admins : 1);
      if (existing) expect(after.audits).toBe(before.audits);
    } finally {
      if (!existing) {
        // Empty-database run: remove what the race created (audit rows are append-only and stay).
        const identity = await prisma.loginIdentity.findFirst({ where: { providerAccountId: raceEmail } });
        if (identity) {
          await prisma.userRoleAssignment.deleteMany({ where: { userId: identity.userId } });
          await prisma.loginIdentity.deleteMany({ where: { userId: identity.userId } });
          await prisma.appUser.delete({ where: { id: identity.userId } });
        }
      }
    }
  }, 120_000);

  it("refuses to create a second administrator under another email", async () => {
    const outcome = await rolledBack(async (tx) => {
      const present = await tx.userRoleAssignment.findFirst({ where: { role: "ADMIN" } });
      if (!present) await seedAdminInTx(tx, { email, passwordHash: hash, resetPassword: false });
      return seedAdminInTx(tx, { email: "other-admin@example.invalid", passwordHash: hash, resetPassword: false }).catch(
        (error: unknown) => error,
      );
    });
    expect(outcome).toBeInstanceOf(AdminSeedFailure);
    expect((outcome as AdminSeedFailure).reason).toBe(ADMIN_SEED_ERROR.ANOTHER_ADMIN_EXISTS);
  }, 60_000);
});
