import "server-only";

import type { MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mapAuditRowsToDto } from "./map-audit-rows.server";
import {
  assertAuditReadAccess,
  AUDIT_LOG_PAGE_SIZE,
  buildAuditWhere,
  decodeAuditCursor,
  encodeAuditCursor,
  type AuditLogFilter,
  type AuditLogListDto,
  type AuditLogPage,
  type RawAuditRow,
} from "./audit-shared.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";

export async function listAuditLog(
  db: PrismaClient,
  actorUserId: string,
  filter: AuditLogFilter,
  page: AuditLogPage,
  adminDict: Dictionary,
  commonDict: Dictionary,
): Promise<MutationResult<AuditLogListDto>> {
  const access = await assertAuditReadAccess(db, actorUserId);
  if (isMutationErr(access)) return access;

  const limit = Math.min(Math.max(page.limit ?? AUDIT_LOG_PAGE_SIZE, 1), 100);
  const cursor = page.cursor ? decodeAuditCursor(page.cursor) : null;
  if (page.cursor && !cursor) {
    return { ok: true, data: { entries: [], nextCursor: null } };
  }

  const where = buildAuditWhere(filter);
  const rows = await db.auditLog.findMany({
    where: cursor
      ? {
          AND: [
            where,
            {
              OR: [
                { occurredAt: { lt: cursor.occurredAt } },
                { occurredAt: cursor.occurredAt, id: { lt: cursor.id } },
              ],
            },
          ],
        }
      : where,
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: limit + 1,
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

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const entries = await mapAuditRowsToDto(
    db,
    pageRows as RawAuditRow[],
    adminDict,
    commonDict,
  );
  const last = pageRows.at(-1);
  const nextCursor =
    hasMore && last ? encodeAuditCursor(last.occurredAt, last.id) : null;

  return { ok: true, data: { entries, nextCursor } };
}
