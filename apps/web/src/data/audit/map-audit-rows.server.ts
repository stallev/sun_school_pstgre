import "server-only";

import {
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  type AuditAction,
  type AuditEntityType,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import { safeAdminMessage } from "@/lib/messages/safe-admin-message";
import {
  resolveAuditActionLabel,
  resolveAuditEntryLabels,
} from "./audit-resolve-labels.server";
import type { AuditLogEntryDto, RawAuditRow } from "./audit-shared.server";
import {
  formatAuditJsonValue,
  isHiddenSystemAuditAction,
  isKnownEntityType,
} from "./audit-shared.server";

type HomeworkCheckContext = { pupilName: string; lessonOrdinal: number };

const stripShortIdSuffix = (label: string): string =>
  label.replace(/\s\([0-9a-f]{8}\)$/i, "").trim();

function formatAuditActionPhrase(adminDict: Dictionary, row: RawAuditRow): string {
  const actionLabel = resolveAuditActionLabel(adminDict, row.action);
  const isSystem =
    row.source === AUDIT_SOURCE.SYSTEM || isHiddenSystemAuditAction(row.action);
  if (!isSystem) return actionLabel;
  const template = getMessage(adminDict, "audit.system_action_phrase");
  return template.replace("{action}", actionLabel);
}

function fieldLabel(adminDict: Dictionary, field: string): string {
  return safeAdminMessage(adminDict, `audit.details.${field}`) ?? field;
}

function formatDetailValue(
  adminDict: Dictionary,
  field: string,
  value: unknown,
): string {
  if (value === null || value === undefined) {
    return getMessage(adminDict, "audit.details.empty");
  }
  if (field === "present" && typeof value === "boolean") {
    return getMessage(adminDict, value ? "audit.details.present_yes" : "audit.details.present_no");
  }
  if (typeof value === "boolean") {
    return getMessage(adminDict, value ? "audit.details.present_yes" : "audit.details.present_no");
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatVerseScoreLines(
  adminDict: Dictionary,
  oldValue: unknown,
  newValue: unknown,
): string[] {
  type VerseRow = { lessonVerseId?: string; score?: number | null };
  const readScores = (raw: unknown): VerseRow[] => {
    if (!raw || typeof raw !== "object") return [];
    const verseScores = (raw as { verseScores?: unknown }).verseScores;
    return Array.isArray(verseScores) ? (verseScores as VerseRow[]) : [];
  };
  const oldScores = readScores(oldValue);
  const newScores = readScores(newValue);
  if (newScores.length === 0 && oldScores.length === 0) return [];

  const byId = new Map<string, { old?: number | null; next?: number | null }>();
  for (const row of oldScores) {
    if (!row.lessonVerseId) continue;
    byId.set(row.lessonVerseId, { ...byId.get(row.lessonVerseId), old: row.score ?? null });
  }
  for (const row of newScores) {
    if (!row.lessonVerseId) continue;
    byId.set(row.lessonVerseId, { ...byId.get(row.lessonVerseId), next: row.score ?? null });
  }

  const lines: string[] = [];
  let index = 1;
  for (const [, pair] of byId) {
    if (pair.old === pair.next) continue;
    const label = getMessage(adminDict, "audit.details.verse_line").replace("{n}", String(index));
    lines.push(`${label}: ${formatDetailValue(adminDict, "score", pair.next ?? pair.old)}`);
    index += 1;
  }
  return lines;
}

export function buildAuditChangeLines(
  adminDict: Dictionary,
  oldValue: unknown,
  newValue: unknown,
): string[] {
  const verseLines = formatVerseScoreLines(adminDict, oldValue, newValue);
  const oldObj =
    oldValue && typeof oldValue === "object" && !Array.isArray(oldValue)
      ? (oldValue as Record<string, unknown>)
      : {};
  const newObj =
    newValue && typeof newValue === "object" && !Array.isArray(newValue)
      ? (newValue as Record<string, unknown>)
      : {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  keys.delete("verseScores");

  const lines: string[] = [...verseLines];
  for (const key of keys) {
    const oldPart = oldObj[key];
    const newPart = newObj[key];
    if (JSON.stringify(oldPart) === JSON.stringify(newPart)) continue;
    const displayValue =
      newPart !== undefined ? formatDetailValue(adminDict, key, newPart) : formatDetailValue(adminDict, key, oldPart);
    lines.push(`${fieldLabel(adminDict, key)}: ${displayValue}`);
  }

  if (lines.length === 0 && (oldValue !== null || newValue !== null)) {
    return [getMessage(adminDict, "audit.details.empty")];
  }
  return lines;
}

function buildEntityDisplay(
  adminDict: Dictionary,
  row: RawAuditRow,
  entityTypeLabel: string,
  resolvedEntityLabel: string,
  homeworkContext?: HomeworkCheckContext,
): string {
  if (row.entityType === AUDIT_ENTITY_TYPE.HOMEWORK_CHECK && homeworkContext) {
    const lessonPart = getMessage(adminDict, "audit.details.lesson_context").replace(
      "{n}",
      String(homeworkContext.lessonOrdinal),
    );
    return `${entityTypeLabel} · ${homeworkContext.pupilName} · ${lessonPart}`;
  }
  const name = stripShortIdSuffix(resolvedEntityLabel) || entityTypeLabel;
  return `${entityTypeLabel} · ${name}`;
}

function buildTechnicalRecord(row: RawAuditRow): string | null {
  const payload = {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    source: row.source,
    actorUserId: row.actorUserId,
    oldValue: row.oldValue ?? null,
    newValue: row.newValue ?? null,
    reason: row.reason,
  };
  return formatAuditJsonValue(payload);
}

async function loadHomeworkCheckContexts(
  db: PrismaClient,
  rows: RawAuditRow[],
  deletedPupilLabel: string,
): Promise<Map<string, HomeworkCheckContext>> {
  const checkIds = rows
    .filter((row) => row.entityType === AUDIT_ENTITY_TYPE.HOMEWORK_CHECK)
    .map((row) => row.entityId);
  if (checkIds.length === 0) return new Map();

  const checks = await db.homeworkCheck.findMany({
    where: { id: { in: checkIds } },
    select: {
      id: true,
      pupil: { select: { firstName: true, lastName: true, middleName: true } },
      lesson: { select: { ordinal: true } },
    },
  });

  const out = new Map<string, HomeworkCheckContext>();
  for (const check of checks) {
    const pupilName =
      [check.pupil.lastName, check.pupil.firstName, check.pupil.middleName]
        .filter(Boolean)
        .join(" ")
        .trim() || deletedPupilLabel;
    out.set(check.id, { pupilName, lessonOrdinal: check.lesson.ordinal });
  }
  for (const id of checkIds) {
    if (!out.has(id)) out.set(id, { pupilName: deletedPupilLabel, lessonOrdinal: 0 });
  }
  return out;
}

export async function mapAuditRowsToDto(
  db: PrismaClient,
  rows: RawAuditRow[],
  adminDict: Dictionary,
  commonDict: Dictionary,
): Promise<AuditLogEntryDto[]> {
  const labels = await resolveAuditEntryLabels(db, rows, adminDict, commonDict);
  const deletedPupilLabel = getMessage(adminDict, "audit.deleted_pupil");
  const homeworkContexts = await loadHomeworkCheckContexts(db, rows, deletedPupilLabel);

  return rows.map((row) => {
    const resolved = labels.get(row.id)!;
    const entityTypeLabel =
      safeAdminMessage(adminDict, `audit.entity_types.${row.entityType}`) ?? row.entityType;
    const homeworkContext =
      row.entityType === AUDIT_ENTITY_TYPE.HOMEWORK_CHECK
        ? (homeworkContexts.get(row.entityId) ?? {
            pupilName: deletedPupilLabel,
            lessonOrdinal: 0,
          })
        : undefined;
    const changeLines = buildAuditChangeLines(adminDict, row.oldValue, row.newValue);
    const actionPhrase = formatAuditActionPhrase(adminDict, row);
    const entityDisplay = buildEntityDisplay(
      adminDict,
      row,
      entityTypeLabel,
      resolved.entityLabel,
      homeworkContext,
    );

    return {
      id: row.id,
      occurredAtIso: row.occurredAt.toISOString(),
      action: row.action as AuditAction,
      entityType: (isKnownEntityType(row.entityType) ? row.entityType : row.entityType) as AuditEntityType,
      entityId: row.entityId,
      actorLabel: resolved.actorLabel,
      entityLabel: resolved.entityLabel,
      entityHref: resolved.entityHref,
      actionPhrase,
      entityDisplay,
      entityIdTitle: row.entityId,
      changeLines,
      isSystemEntry:
        row.source === AUDIT_SOURCE.SYSTEM || isHiddenSystemAuditAction(row.action),
      technicalRecordJson: buildTechnicalRecord(row),
      reason: row.reason,
      oldValueText: formatAuditJsonValue(row.oldValue),
      newValueText: formatAuditJsonValue(row.newValue),
    };
  });
}
