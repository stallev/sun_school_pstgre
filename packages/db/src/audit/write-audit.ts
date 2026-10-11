import {
  serializeAuditValues,
  type AuditAction,
  type AuditEntityType,
  type AuditSource,
} from "@sunschool/domain";
import type { Prisma } from "../generated/prisma/client";

/**
 * The ONLY place that writes `audit_log` (change_log_contract §5, §11; R-6, INV-16).
 * - requires a transaction client, so the record commits or rolls back with the change it describes;
 * - the table is append-only: this module has no update / delete / upsert;
 * - values pass through `serializeAuditValues`, which drops names, email and tokens (INV-23).
 */
export type AuditEntry = {
  /** `null` for SYSTEM records (seed, lazy purge). */
  actorUserId: string | null;
  source: AuditSource;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  requestId?: string | null;
};

export const AUDIT_OUTSIDE_TRANSACTION = "writeAudit requires a transaction client (prisma.$transaction)";

export async function writeAudit(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
  // A root PrismaClient exposes `$disconnect` (and `$connect`); an interactive transaction client
  // omits them (verified on Prisma 7.10: `$transaction` is present on both, so it cannot tell).
  if (typeof (tx as unknown as { $disconnect?: unknown }).$disconnect === "function") {
    throw new Error(AUDIT_OUTSIDE_TRANSACTION);
  }
  const oldValue = serializeAuditValues(entry.oldValue);
  const newValue = serializeAuditValues(entry.newValue);
  await tx.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      source: entry.source,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      oldValue: (oldValue ?? undefined) as Prisma.InputJsonValue | undefined,
      newValue: (newValue ?? undefined) as Prisma.InputJsonValue | undefined,
      reason: entry.reason ?? null,
      requestId: entry.requestId ?? null,
    },
  });
}
