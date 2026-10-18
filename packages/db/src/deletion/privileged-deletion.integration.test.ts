/**
 * Privileged deletion procedures (P06-CU2). Requires APP_ENV=dev, DIRECT_URL, and migration
 * `20261018120000_deletion_procedures`. All cases run in rolled-back transactions.
 */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "@sunschool/domain";
import { createPrismaClient } from "../client";
import type { PrismaClient } from "../generated/prisma/client";
import { writeAudit } from "../audit/write-audit";
import { DELETION_PRIVILEGED_CONTEXT_REQUIRED } from "./constants";
import { deleteBrickLedgerForPupilPrivileged } from "./delete-brick-ledger-for-pupil";
import { scrubAuditLogForPupilPrivileged } from "./scrub-audit-log-for-pupil";
import { scrubAuditLogForUserPrivileged } from "./scrub-audit-log-for-user";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");

describe.skipIf(!enabled)("privileged deletion procedures on dev database", () => {
  let prisma: PrismaClient;
  let migrationReady = false;

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
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'sunschool_privileged_delete_brick_ledger_for_pupil'
      ) AS exists
    `;
    migrationReady = rows[0]?.exists === true;
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("migration functions exist", () => {
    expect(migrationReady).toBe(true);
  });

  it("sunschool_app cannot DELETE brick_ledger or UPDATE audit_log (R-6)", async () => {
    if (!migrationReady) return;
    const pupilId = randomUUID();
    await rolledBack(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE sunschool_app`;
      await expect(tx.$executeRaw`DELETE FROM brick_ledger WHERE pupil_id = ${pupilId}::uuid`).rejects.toThrow(
        /permission denied/i,
      );
      const auditId = randomUUID();
      await expect(tx.$executeRaw`UPDATE audit_log SET reason = 'x' WHERE id = ${auditId}::uuid`).rejects.toThrow(
        /permission denied/i,
      );
    });
  }, 60_000);

  it("privileged delete removes brick rows; missing pupil returns 0", async () => {
    if (!migrationReady) return;
    const org = await prisma.organization.findFirst();
    const year = await prisma.academicYear.findFirst({ where: { organizationId: org?.id } });
    const issuer = await prisma.appUser.findFirst();
    if (!org || !year || !issuer) return;

    await rolledBack(async (tx) => {
      const pupil = await tx.pupil.create({
        data: {
          organizationId: org.id,
          lastName: "Тест",
          firstName: "Удаление",
        },
      });
      await tx.brickLedger.create({
        data: {
          pupilId: pupil.id,
          academicYearId: year.id,
          quantity: 1,
          issuedOn: new Date(),
          issuedById: issuer.id,
        },
      });
      const deleted = await deleteBrickLedgerForPupilPrivileged(tx, pupil.id);
      expect(deleted).toBe(1);
      expect(await tx.brickLedger.count({ where: { pupilId: pupil.id } })).toBe(0);
      const missing = await deleteBrickLedgerForPupilPrivileged(tx, randomUUID());
      expect(missing).toBe(0);
    });
  }, 60_000);

  it("rejects privileged SQL without context and scrubs audit values", async () => {
    if (!migrationReady) return;
    const org = await prisma.organization.findFirst();
    if (!org) return;

    await rolledBack(async (tx) => {
      const pupil = await tx.pupil.create({
        data: {
          organizationId: org.id,
          lastName: "Журнал",
          firstName: "Тест",
        },
      });
      await writeAudit(tx, {
        actorUserId: null,
        source: AUDIT_SOURCE.SYSTEM,
        entityType: AUDIT_ENTITY_TYPE.PUPIL,
        entityId: pupil.id,
        action: AUDIT_ACTION.SCHOOL_PUPIL_CREATED,
        newValue: { lastName: "Журнал" },
        reason: "тест",
      });
      await expect(
        tx.$queryRaw`SELECT sunschool_privileged_scrub_audit_log_for_pupil(${pupil.id}::uuid)`,
      ).rejects.toThrow(DELETION_PRIVILEGED_CONTEXT_REQUIRED);

      const scrubbed = await scrubAuditLogForPupilPrivileged(tx, pupil.id);
      expect(scrubbed).toBe(1);
      const row = await tx.auditLog.findFirst({
        where: { entityType: AUDIT_ENTITY_TYPE.PUPIL, entityId: pupil.id },
      });
      expect(row?.newValue).toBeNull();
      expect(row?.oldValue).toBeNull();
      expect(row?.reason).toBeNull();
    });
  }, 60_000);

  it("scrubs reject reason with PII for anonymized actor", async () => {
    if (!migrationReady) return;
    const org = await prisma.organization.findFirst();
    if (!org) return;

    await rolledBack(async (tx) => {
      const actor = await tx.appUser.create({
        data: {
          organizationId: org.id,
          lastName: "Админов",
          firstName: "Тест",
          status: "ACTIVE",
        },
      });
      const requestId = randomUUID();
      await writeAudit(tx, {
        actorUserId: actor.id,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
        entityId: requestId,
        action: AUDIT_ACTION.DELETION_REJECTED,
        reason: "Не подтверждено: Иванов Иван Иванович",
      });

      const scrubbed = await scrubAuditLogForUserPrivileged(tx, actor.id);
      expect(scrubbed).toBe(1);
      const row = await tx.auditLog.findFirst({ where: { actorUserId: actor.id } });
      expect(row?.reason).toBeNull();
    });
  }, 60_000);
});
