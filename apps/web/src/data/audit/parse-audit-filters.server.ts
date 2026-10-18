import "server-only";

import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, type AuditAction, type AuditEntityType } from "@sunschool/domain";
import type { AuditLogFilter } from "./audit-shared.server";

const isAuditAction = (value: string): value is AuditAction =>
  Object.values(AUDIT_ACTION).includes(value as AuditAction);

const isAuditEntityType = (value: string): value is AuditEntityType =>
  Object.values(AUDIT_ENTITY_TYPE).includes(value as AuditEntityType);

export function parseAuditLogFilter(params: {
  from?: string;
  to?: string;
  actor?: string;
  entityType?: string;
  action?: string;
  entityId?: string;
}): AuditLogFilter {
  const filter: AuditLogFilter = {};
  if (params.from) {
    const from = new Date(`${params.from}T00:00:00.000Z`);
    if (!Number.isNaN(from.getTime())) filter.from = from;
  }
  if (params.to) {
    const to = new Date(`${params.to}T23:59:59.999Z`);
    if (!Number.isNaN(to.getTime())) filter.to = to;
  }
  if (params.actor) filter.actorUserId = params.actor;
  if (params.entityType && isAuditEntityType(params.entityType)) filter.entityType = params.entityType;
  if (params.action && isAuditAction(params.action)) filter.action = params.action;
  if (params.entityId) filter.entityId = params.entityId;
  return filter;
}
