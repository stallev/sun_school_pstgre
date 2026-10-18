import "server-only";

import type { AuditEntityType, MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mapAuditRowsToDto } from "./map-audit-rows.server";
import {
  assertAuditReadAccess,
  ENTITY_HISTORY_LIMIT,
  type AuditLogEntryDto,
  type RawAuditRow,
} from "./audit-shared.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";

export async function getEntityHistory(
  db: PrismaClient,
  actorUserId: string,
  entityType: AuditEntityType,
  entityId: string,
  adminDict: Dictionary,
  commonDict: Dictionary,
  limit = ENTITY_HISTORY_LIMIT,
): Promise<MutationResult<AuditLogEntryDto[]>> {
  const access = await assertAuditReadAccess(db, actorUserId);
  if (isMutationErr(access)) return access;

  const rows = await db.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: limit,
    select: {
      id: true,
      occurredAt: true,
      actorUserId: true,
      source: true,
      entityType: true,
      entityId: true,
      action: true,
      oldValue: true,
      newValue: true,
      reason: true,
    },
  });

  const entries = await mapAuditRowsToDto(db, rows as RawAuditRow[], adminDict, commonDict);
  return { ok: true, data: entries };
}
