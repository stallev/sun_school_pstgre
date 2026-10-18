import "server-only";

import {
  AUDIT_ENTITY_TYPE,
  type AuditAction,
  type AuditEntityType,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { assertAdminActor } from "../school/school-enrollment-shared.server";

export const AUDIT_LOG_PAGE_SIZE = 25;
export const ENTITY_HISTORY_LIMIT = 15;

export type AuditLogFilter = {
  from?: Date;
  to?: Date;
  actorUserId?: string;
  entityType?: AuditEntityType;
  action?: AuditAction;
  entityId?: string;
};

export type AuditLogPage = {
  cursor?: string;
  limit?: number;
};

export type AuditLogEntryDto = {
  id: string;
  occurredAtIso: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  actorLabel: string;
  entityLabel: string;
  entityHref: string | null;
  reason: string | null;
  oldValueText: string | null;
  newValueText: string | null;
};

export type AuditLogListDto = {
  entries: AuditLogEntryDto[];
  nextCursor: string | null;
};

export async function assertAuditReadAccess(db: PrismaClient, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const denied = await assertAdminActor(tx, actorUserId);
    return denied;
  });
}

export function encodeAuditCursor(occurredAt: Date, id: string): string {
  return `${occurredAt.toISOString()}|${id}`;
}

export function decodeAuditCursor(cursor: string): { occurredAt: Date; id: string } | null {
  const separator = cursor.indexOf("|");
  if (separator <= 0) return null;
  const occurredAt = new Date(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
  if (Number.isNaN(occurredAt.getTime()) || id.length === 0) return null;
  return { occurredAt, id };
}

export function buildAuditWhere(filter: AuditLogFilter): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.from || filter.to) {
    where.occurredAt = {
      ...(filter.from ? { gte: filter.from } : {}),
      ...(filter.to ? { lte: filter.to } : {}),
    };
  }
  if (filter.actorUserId) where.actorUserId = filter.actorUserId;
  if (filter.entityType) where.entityType = filter.entityType;
  if (filter.action) where.action = filter.action;
  if (filter.entityId) where.entityId = filter.entityId;
  return where;
}

export function formatAuditJsonValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export type RawAuditRow = {
  id: string;
  occurredAt: Date;
  actorUserId: string | null;
  source: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
};

export const isKnownEntityType = (value: string): value is AuditEntityType =>
  Object.values(AUDIT_ENTITY_TYPE).includes(value as AuditEntityType);
