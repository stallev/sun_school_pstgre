/**
 * Integration tests of Telegram sign-in, lazy purge and session claims on the DEV database.
 * Cases run in transactions that are rolled back; the double-first-login race commits two
 * competing transactions with a unique key and removes its rows afterwards (no audit row is
 * written on that path). Skipped without APP_ENV=dev + DIRECT_URL.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type Prisma, type PrismaClient } from "@sunschool/db";
import { signInTelegram, signInTelegramInTransaction } from "./first-login";
import { linkTelegram } from "./link-provider";
import { unlinkProvider } from "./unlink-provider";
import { purgeExpiredRegistrations } from "./purge-expired-registration";
import { resolveSessionClaims } from "./session-claims";
import { approveRequestInTransaction } from "./approve-request";
import { submitRegistrationInTransaction } from "./submit-registration";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");
const NOW = new Date("2026-10-16T10:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe.skipIf(!enabled)("access use-cases on the dev database", () => {
  let prisma: PrismaClient;
  let organizationId: string;

  const rolledBack = async <T>(body: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
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
    const organization = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    if (!organization) throw new Error("run db:seed:reference first");
    organizationId = organization.id;
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("a new Telegram login creates REGISTRATION with username and phone", async () => {
    const id = unique();
    const out = await rolledBack(async (tx) => {
      const result = await signInTelegram(tx, { providerAccountId: id, username: "pkim", phone: "+79001112233", now: NOW });
      const identity = await tx.loginIdentity.findFirst({ where: { providerAccountId: id } });
      return { result, identity };
    });
    expect(out.result).toMatchObject({ kind: "ok", status: "REGISTRATION", created: true });
    expect(out.identity).toMatchObject({ provider: "TELEGRAM", username: "pkim", phone: "+79001112233", email: null });
  }, 60_000);

  it("a repeat login is idempotent and an empty phone does not erase the stored one", async () => {
    const id = unique();
    const out = await rolledBack(async (tx) => {
      const first = await signInTelegram(tx, { providerAccountId: id, username: "pkim", phone: "+79001112233", now: NOW });
      const later = new Date(NOW.getTime() + 3600_000);
      const second = await signInTelegram(tx, { providerAccountId: id, username: null, phone: null, now: later });
      const identities = await tx.loginIdentity.count({ where: { providerAccountId: id } });
      const identity = await tx.loginIdentity.findFirst({ where: { providerAccountId: id } });
      const user = await tx.appUser.findFirst({ where: { identities: { some: { providerAccountId: id } } } });
      return { first, second, identities, identity, user };
    });
    expect(out.second).toMatchObject({ kind: "ok", created: false });
    expect(out.second.kind === "ok" && out.first.kind === "ok" && out.second.userId === out.first.userId).toBe(true);
    expect(out.identities).toBe(1);
    expect(out.identity).toMatchObject({ username: "pkim", phone: "+79001112233" });
    expect(out.user?.lastLoginAt?.getTime()).toBe(NOW.getTime() + 3600_000);
  }, 60_000);

  it("refuses DISABLED and DELETED users", async () => {
    for (const status of ["DISABLED", "DELETED"] as const) {
      const id = unique();
      const result = await rolledBack(async (tx) => {
        await tx.appUser.create({
          data: { organizationId, status, firstLoginAt: NOW, identities: { create: { provider: "TELEGRAM", providerAccountId: id } } },
        });
        return signInTelegram(tx, { providerAccountId: id, username: null, phone: null, now: NOW });
      });
      expect(result, status).toEqual({ kind: "denied" });
    }
  }, 60_000);

  it("purges an expired REGISTRATION of the same person and creates it again (audit: SYSTEM, no PII)", async () => {
    const id = unique();
    const out = await rolledBack(async (tx) => {
      const old = await tx.appUser.create({
        data: {
          organizationId,
          status: "REGISTRATION",
          firstLoginAt: daysAgo(40),
          identities: { create: { provider: "TELEGRAM", providerAccountId: id, phone: "+70000000001" } },
        },
      });
      const result = await signInTelegram(tx, { providerAccountId: id, username: null, phone: null, now: NOW });
      const oldStill = await tx.appUser.findUnique({ where: { id: old.id } });
      const audit = await tx.auditLog.findFirst({ where: { entityId: old.id, action: "access.registration_purged" } });
      return { old, result, oldStill, audit };
    });
    expect(out.oldStill).toBeNull();
    expect(out.result).toMatchObject({ kind: "ok", created: true, status: "REGISTRATION" });
    expect(out.result.kind === "ok" && out.result.userId !== out.old.id).toBe(true);
    expect(out.audit).toMatchObject({ source: "SYSTEM", actorUserId: null, entityType: "app_user" });
    expect(JSON.stringify(out.audit)).not.toContain("+7000");
  }, 60_000);

  it("purgeExpiredRegistrations removes only expired REGISTRATION users", async () => {
    const out = await rolledBack(async (tx) => {
      const mk = (status: "REGISTRATION" | "REQUEST_PENDING", days: number) =>
        tx.appUser.create({
          data: {
            organizationId,
            status,
            firstLoginAt: daysAgo(days),
            identities: { create: { provider: "TELEGRAM", providerAccountId: unique() } },
          },
        });
      const expired = await mk("REGISTRATION", 45);
      const fresh = await mk("REGISTRATION", 3);
      const pending = await mk("REQUEST_PENDING", 90);
      const purged = await purgeExpiredRegistrations(tx, NOW);
      const left = await tx.appUser.findMany({ where: { id: { in: [expired.id, fresh.id, pending.id] } }, select: { id: true } });
      return { purged, left: left.map((u) => u.id), expired: expired.id, fresh: fresh.id, pending: pending.id };
    });
    expect(out.purged).toBeGreaterThanOrEqual(1);
    expect(out.left).not.toContain(out.expired);
    expect(out.left).toEqual(expect.arrayContaining([out.fresh, out.pending]));
  }, 60_000);

  it("session claims come from the database: uid ≠ provider id, roles included", async () => {
    const id = unique();
    const claims = await rolledBack(async (tx) => {
      const user = await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          roles: { create: [{ role: "TEACHER" }] },
          identities: { create: { provider: "TELEGRAM", providerAccountId: id } },
        },
      });
      const viaTelegram = await resolveSessionClaims(tx as unknown as PrismaClient, { provider: "TELEGRAM", providerAccountId: id });
      const viaCredentials = await resolveSessionClaims(tx as unknown as PrismaClient, { provider: "CREDENTIALS", providerAccountId: user.id });
      return { user, viaTelegram, viaCredentials };
    });
    expect(claims.viaTelegram).toEqual({ uid: claims.user.id, status: "ACTIVE", roles: ["TEACHER"] });
    expect(claims.viaTelegram?.uid).not.toBe(id);
    expect(claims.viaCredentials).toEqual(claims.viaTelegram);
  }, 60_000);

  it("REGISTRATION submit moves user to REQUEST_PENDING with consent, request and audit", async () => {
    const id = unique();
    const out = await rolledBack(async (tx) => {
      const login = await signInTelegram(tx, { providerAccountId: id, username: "reg", phone: null, now: NOW });
      if (login.kind !== "ok") throw new Error("expected login");
      const result = await submitRegistrationInTransaction(
        tx,
        login.userId,
        { lastName: "Иванов", firstName: "Пётр", middleName: "Сергеевич", consentAccepted: true },
        NOW,
      );
      const user = await tx.appUser.findUnique({ where: { id: login.userId } });
      const consent = await tx.privacyConsent.findFirst({ where: { userId: login.userId } });
      const request = await tx.accessRequest.findFirst({ where: { userId: login.userId } });
      const audit = await tx.auditLog.findFirst({
        where: { entityId: request?.id, action: "access.registration_submitted" },
      });
      return { result, user, consent, request, audit };
    });
    expect(out.result).toEqual({ ok: true });
    expect(out.user).toMatchObject({
      status: "REQUEST_PENDING",
      lastName: "Иванов",
      firstName: "Пётр",
      middleName: "Сергеевич",
    });
    expect(out.consent).toMatchObject({ type: "PD_PROCESSING" });
    expect(out.request).toMatchObject({ status: "PENDING", fullNameSnapshot: "Иванов Пётр Сергеевич" });
    expect(out.audit).toMatchObject({ source: "USER", entityType: "access_request" });
    expect(JSON.stringify(out.audit)).not.toContain("Иванов");
  }, 60_000);

  it("approveRequest moves REQUEST_PENDING to ACTIVE with roles and audit", async () => {
    const id = unique();
    const out = await rolledBack(async (tx) => {
      const login = await signInTelegram(tx, { providerAccountId: id, username: "appr", phone: null, now: NOW });
      if (login.kind !== "ok") throw new Error("expected login");
      await submitRegistrationInTransaction(
        tx,
        login.userId,
        { lastName: "Сидоров", firstName: "Иван", consentAccepted: true },
        NOW,
      );
      const request = await tx.accessRequest.findFirst({ where: { userId: login.userId, status: "PENDING" } });
      if (!request) throw new Error("expected pending request");
      const admin = await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          roles: { create: [{ role: "ADMIN" }] },
          identities: { create: { provider: "CREDENTIALS", providerAccountId: unique(), passwordHash: "hash" } },
        },
      });
      const result = await approveRequestInTransaction(tx, admin.id, {
        requestId: request.id,
        roles: ["TEACHER"],
        gradeIds: [],
      }, NOW);
      const user = await tx.appUser.findUnique({ where: { id: login.userId } });
      const roles = await tx.userRoleAssignment.findMany({ where: { userId: login.userId } });
      const audit = await tx.auditLog.findFirst({
        where: { entityId: request.id, action: "access.request_approved" },
      });
      return { result, user, roles, audit };
    });
    expect(out.result).toMatchObject({ ok: true, warnings: ["NO_GROUPS"] });
    expect(out.user?.status).toBe("ACTIVE");
    expect(out.roles.map((r) => r.role)).toEqual(["TEACHER"]);
    expect(out.audit).toMatchObject({ source: "USER", entityType: "access_request" });
  }, 60_000);

  it("second approve on the same request returns ACCESS_REQUEST_DECIDED", async () => {
    const id = unique();
    const out = await rolledBack(async (tx) => {
      const login = await signInTelegram(tx, { providerAccountId: id, username: "race", phone: null, now: NOW });
      if (login.kind !== "ok") throw new Error("expected login");
      await submitRegistrationInTransaction(
        tx,
        login.userId,
        { lastName: "Громов", firstName: "Алексей", consentAccepted: true },
        NOW,
      );
      const request = await tx.accessRequest.findFirst({ where: { userId: login.userId, status: "PENDING" } });
      if (!request) throw new Error("expected pending request");
      const admin = await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          roles: { create: [{ role: "ADMIN" }] },
          identities: { create: { provider: "CREDENTIALS", providerAccountId: unique(), passwordHash: "hash" } },
        },
      });
      const first = await approveRequestInTransaction(tx, admin.id, {
        requestId: request.id,
        roles: ["ADMIN"],
        gradeIds: [],
      }, NOW);
      const second = await approveRequestInTransaction(tx, admin.id, {
        requestId: request.id,
        roles: ["ADMIN"],
        gradeIds: [],
      }, NOW);
      return { first, second };
    });
    expect(out.first).toEqual({ ok: true });
    expect(out.second).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_REQUEST_DECIDED,
      message: "admin.approvals.already_decided",
    });
  }, 60_000);

  it("links a free Telegram identity to an admin with credentials", async () => {
    const tgId = unique();
    const out = await rolledBack(async (tx) => {
      const admin = await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          roles: { create: [{ role: "ADMIN" }] },
          identities: {
            create: {
              provider: "CREDENTIALS",
              providerAccountId: unique(),
              passwordHash: "hash",
              email: "admin-link@test.local",
            },
          },
        },
      });
      const first = await linkTelegram(tx, {
        userId: admin.id,
        providerAccountId: tgId,
        username: "linked",
        phone: null,
        now: NOW,
      });
      const second = await linkTelegram(tx, {
        userId: admin.id,
        providerAccountId: tgId,
        username: "linked",
        phone: null,
        now: NOW,
      });
      const count = await tx.loginIdentity.count({ where: { userId: admin.id } });
      const audit = await tx.auditLog.findFirst({
        where: { entityId: admin.id, action: "auth.identity_linked" },
      });
      return { first, second, count, audit };
    });
    expect(out.first).toEqual({ ok: true });
    expect(out.second).toEqual({ ok: true });
    expect(out.count).toBe(2);
    expect(out.audit).toMatchObject({ source: "USER", entityType: "login_identity" });
    expect(JSON.stringify(out.audit)).not.toContain(tgId);
  }, 60_000);

  it("refuses linking a Telegram id that belongs to another user", async () => {
    const tgId = unique();
    const result = await rolledBack(async (tx) => {
      await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          identities: { create: { provider: "TELEGRAM", providerAccountId: tgId } },
        },
      });
      const admin = await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          identities: {
            create: { provider: "CREDENTIALS", providerAccountId: unique(), passwordHash: "hash" },
          },
        },
      });
      return linkTelegram(tx, {
        userId: admin.id,
        providerAccountId: tgId,
        username: null,
        phone: null,
        now: NOW,
      });
    });
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.AUTH_LINK_CONFLICT });
  }, 60_000);

  it("unlinkProvider refuses the last identity and allows removing Telegram when credentials remain", async () => {
    const out = await rolledBack(async (tx) => {
      const user = await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          identities: {
            create: [
              { provider: "TELEGRAM", providerAccountId: unique() },
              { provider: "CREDENTIALS", providerAccountId: unique(), passwordHash: "hash" },
            ],
          },
        },
      });
      const last = await unlinkProvider(
        { $transaction: (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx) } as never,
        user.id,
        "TELEGRAM",
      );
      const onlyTelegram = await tx.appUser.create({
        data: {
          organizationId,
          status: "ACTIVE",
          identities: { create: { provider: "TELEGRAM", providerAccountId: unique() } },
        },
      });
      const blocked = await unlinkProvider(
        { $transaction: (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx) } as never,
        onlyTelegram.id,
        "TELEGRAM",
      );
      const remaining = await tx.loginIdentity.count({ where: { userId: user.id } });
      return { last, blocked, remaining };
    });
    expect(out.last).toEqual({ ok: true });
    expect(out.blocked).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.AUTH_LAST_IDENTITY });
    expect(out.remaining).toBe(1);
  }, 60_000);

  it("double first login: two competing transactions end with ONE user and identity", async () => {
    const id = unique();
    try {
      const results = await Promise.all([
        signInTelegramInTransaction(prisma, { providerAccountId: id, username: "a", phone: null, now: NOW }),
        signInTelegramInTransaction(prisma, { providerAccountId: id, username: "a", phone: null, now: NOW }),
      ]);
      expect(results.every((r) => r.kind === "ok")).toBe(true);
      expect(await prisma.loginIdentity.count({ where: { providerAccountId: id } })).toBe(1);
      const ids = new Set(results.map((r) => (r.kind === "ok" ? r.userId : "")));
      expect(ids.size).toBe(1);
    } finally {
      const identity = await prisma.loginIdentity.findFirst({ where: { providerAccountId: id } });
      if (identity) {
        await prisma.loginIdentity.deleteMany({ where: { userId: identity.userId } });
        await prisma.appUser.delete({ where: { id: identity.userId } });
      }
    }
  }, 60_000);
});
