/**
 * executeDeletion rollback + audit scrub (deletion_requests §10). Requires APP_ENV=dev, DIRECT_URL,
 * migration `20261018120000_deletion_procedures`.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  USER_ROLE,
} from "@sunschool/domain";
import { createPrismaClient, writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { executeDeletionInTransaction } from "./execute-deletion";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");

describe.skipIf(!enabled)("executeDeletionInTransaction on dev database", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let adminId: string;
  let migrationReady = false;

  const rolledBack = async <T>(body: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
    let result: T | undefined;
    await prisma
      .$transaction(
        async (tx) => {
          result = await body(tx);
          throw ROLLBACK;
        },
        { timeout: 60_000 },
      )
      .catch((error: unknown) => {
        if (error !== ROLLBACK) throw error;
      });
    return result as T;
  };

  beforeAll(async () => {
    prisma = createPrismaClient(process.env.DIRECT_URL ?? "");
    const organization = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    const admin = await prisma.appUser.findFirst({
      where: { roles: { some: { role: USER_ROLE.ADMIN } } },
      orderBy: { createdAt: "asc" },
    });
    if (!organization || !admin) throw new Error("run db:seed:reference first");
    organizationId = organization.id;
    adminId = admin.id;
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'sunschool_privileged_scrub_audit_log_for_pupil'
      ) AS exists
    `;
    migrationReady = rows[0]?.exists === true;
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rolls back child erasure when the transaction aborts", async () => {
    if (!migrationReady) return;

    const pupil = await prisma.pupil.create({
      data: {
        organizationId,
        lastName: "Тест",
        firstName: "Откат",
      },
    });

    await rolledBack(async (tx) => {
      const { eraseChildDataInTransaction } = await import("./erase-child-data");
      await eraseChildDataInTransaction(tx, pupil.id);
    });

    expect(await prisma.pupil.count({ where: { id: pupil.id } })).toBe(1);
    await prisma.pupil.delete({ where: { id: pupil.id } });
  }, 60_000);

  it("scrubs audit values and removes pupil on success", async () => {
    if (!migrationReady) return;

    const now = new Date();

    const out = await rolledBack(async (tx) => {
      const pupil = await tx.pupil.create({
        data: {
          organizationId,
          lastName: "Журнал",
          firstName: "Удаление",
        },
      });
      const request = await tx.deletionRequest.create({
        data: {
          type: DELETION_REQUEST_TYPE.CHILD_DATA,
          subjectPupilId: pupil.id,
          requestedById: adminId,
          requestedAt: now,
          dueOn: now,
          status: DELETION_REQUEST_STATUS.IN_PROGRESS,
        },
        select: { id: true },
      });
      await writeAudit(tx, {
        actorUserId: adminId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.PUPIL,
        entityId: pupil.id,
        action: AUDIT_ACTION.SCHOOL_PUPIL_CREATED,
        newValue: { lastName: "Журнал" },
        reason: "тест",
      });

      const result = await executeDeletionInTransaction(
        tx,
        adminId,
        { requestId: request.id, confirmWord: "удалить", acknowledgePlan: true },
        now,
      );

      const audit = await tx.auditLog.findFirst({
        where: { entityType: AUDIT_ENTITY_TYPE.PUPIL, entityId: pupil.id },
      });
      const pupilRow = await tx.pupil.findUnique({ where: { id: pupil.id } });
      const done = await tx.deletionRequest.findUnique({ where: { id: request.id } });
      return { result, audit, pupilRow, done };
    });

    expect(out.result.ok).toBe(true);
    expect(out.pupilRow).toBeNull();
    expect(out.audit?.newValue).toBeNull();
    expect(out.audit?.reason).toBeNull();
    expect(out.done?.status).toBe(DELETION_REQUEST_STATUS.DONE);
    expect(out.done?.subjectPupilId).toBeNull();
    expect(out.done?.subjectUserId).toBe(adminId);
  }, 60_000);
});
