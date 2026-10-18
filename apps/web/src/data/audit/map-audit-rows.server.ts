import "server-only";

import type { AuditAction, AuditEntityType } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveAuditEntryLabels } from "./audit-resolve-labels.server";
import type { AuditLogEntryDto, RawAuditRow } from "./audit-shared.server";
import { formatAuditJsonValue, isKnownEntityType } from "./audit-shared.server";

export async function mapAuditRowsToDto(
  db: PrismaClient,
  rows: RawAuditRow[],
  adminDict: Dictionary,
  commonDict: Dictionary,
): Promise<AuditLogEntryDto[]> {
  const labels = await resolveAuditEntryLabels(db, rows, adminDict, commonDict);
  return rows.map((row) => {
    const resolved = labels.get(row.id)!;
    return {
      id: row.id,
      occurredAtIso: row.occurredAt.toISOString(),
      action: row.action as AuditAction,
      entityType: (isKnownEntityType(row.entityType) ? row.entityType : row.entityType) as AuditEntityType,
      entityId: row.entityId,
      actorLabel: resolved.actorLabel,
      entityLabel: resolved.entityLabel,
      entityHref: resolved.entityHref,
      reason: row.reason,
      oldValueText: formatAuditJsonValue(row.oldValue),
      newValueText: formatAuditJsonValue(row.newValue),
    };
  });
}
