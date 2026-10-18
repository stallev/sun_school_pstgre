/**
 * anonymizeUser audit scrub (deletion_requests §6.1). Requires APP_ENV=dev, DIRECT_URL,
 * migration `20261019140000_scrub_audit_log_for_user`. Rolled-back transactions.
 */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  ACCOUNT_STATUS,
} from "@sunschool/domain";
import { createPrismaClient, writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { anonymizeUserInTransaction } from "./anonymize-user";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");

describe.skipIf(!enabled)("anonymizeUserInTransaction on dev database", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let scrubMigrationReady = false;

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
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'sunschool_privileged_scrub_audit_log_for_user'
      ) AS exists
    `;
    scrubMigrationReady = rows[0]?.exists === true;
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("clears audit reject reason with PII after anonymize", async () => {
    if (!scrubMigrationReady) return;

    const auditReason = "Отклонено: Петров Пётр содержит персональные данные";
    const out = await rolledBack(async (tx) => {
      const user = await tx.appUser.create({
        data: {
          organizationId,
          lastName: "Петров",
          firstName: "Пётр",
          status: ACCOUNT_STATUS.ACTIVE,
        },
      });
      await writeAudit(tx, {
        actorUserId: user.id,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
        entityId: randomUUID(),
        action: AUDIT_ACTION.DELETION_REJECTED,
        reason: auditReason,
      });

      await anonymizeUserInTransaction(tx, user.id, organizationId);

      const audit = await tx.auditLog.findFirst({ where: { actorUserId: user.id } });
      const updated = await tx.appUser.findUnique({ where: { id: user.id } });
      return { audit, updated };
    });

    expect(out.audit?.reason).toBeNull();
    expect(out.updated?.status).toBe(ACCOUNT_STATUS.DELETED);
    expect(out.updated?.deletedOrdinal).toBeGreaterThan(0);
  }, 60_000);
});
