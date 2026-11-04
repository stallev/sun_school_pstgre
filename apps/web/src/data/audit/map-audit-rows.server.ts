import "server-only";

import {
  AUDIT_ACTION,
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
  buildAuditChangeLines,
  collectAuditDetailIds,
  stripShortIdSuffix,
  type AuditDetailLabelContext,
} from "./audit-details-format";
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

type HomeworkCheckContext = { pupilName: string; lessonOrdinal: number | null };

const CONTEXT_BY_PUPIL_ENTITY_TYPES = new Set<string>([
  AUDIT_ENTITY_TYPE.BRICK_LEDGER,
  AUDIT_ENTITY_TYPE.PENALTY,
  AUDIT_ENTITY_TYPE.ACHIEVEMENT_AWARD,
]);

const CONTEXT_BY_GRADE_ENTITY_TYPES = new Set<string>([AUDIT_ENTITY_TYPE.GRADE_SETTINGS]);

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readIdField(field: "pupilId" | "gradeId", ...values: unknown[]): string | undefined {
  for (const value of values) {
    const candidate = readRecord(value)[field];
    if (typeof candidate === "string") return candidate;
  }
  return undefined;
}

function formatAuditActionPhrase(adminDict: Dictionary, row: RawAuditRow): string {
  if (row.action === AUDIT_ACTION.ACHIEVEMENT_CATALOG_TOGGLED) {
    const payload = readRecord(row.newValue ?? row.oldValue);
    if (payload.isActive === true) {
      return getMessage(adminDict, "audit.actions.achievement.catalog_toggled_on");
    }
    if (payload.isActive === false) {
      return getMessage(adminDict, "audit.actions.achievement.catalog_toggled_off");
    }
    return resolveAuditActionLabel(adminDict, row.action);
  }
  return resolveAuditActionLabel(adminDict, row.action);
}

function formatLessonContext(adminDict: Dictionary, lessonOrdinal: number | null): string {
  if (lessonOrdinal == null || lessonOrdinal <= 0) {
    return getMessage(adminDict, "audit.details.lesson_unspecified");
  }
  return getMessage(adminDict, "audit.details.lesson_context").replace("{n}", String(lessonOrdinal));
}

function buildEntityDisplay(
  adminDict: Dictionary,
  row: RawAuditRow,
  entityTypeLabel: string,
  resolvedEntityLabel: string,
  homeworkContext?: HomeworkCheckContext,
  contextSuffix?: string,
): string {
  if (row.entityType === AUDIT_ENTITY_TYPE.HOMEWORK_CHECK && homeworkContext) {
    const lessonPart = formatLessonContext(adminDict, homeworkContext.lessonOrdinal);
    return `${entityTypeLabel} · ${homeworkContext.pupilName} · ${lessonPart}`;
  }

  const name = stripShortIdSuffix(resolvedEntityLabel);
  if (!name || name === entityTypeLabel) {
    if (contextSuffix) return `${entityTypeLabel} · ${contextSuffix}`;
    return entityTypeLabel;
  }
  if (name.startsWith(`${entityTypeLabel} ·`)) {
    return contextSuffix ? `${name} · ${contextSuffix}` : name;
  }
  if (contextSuffix) return `${entityTypeLabel} · ${contextSuffix}`;
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
    if (!out.has(id)) out.set(id, { pupilName: deletedPupilLabel, lessonOrdinal: null });
  }
  return out;
}

async function loadAuditDetailLabelContext(
  db: PrismaClient,
  rows: RawAuditRow[],
  adminDict: Dictionary,
): Promise<AuditDetailLabelContext> {
  const pupilIds = new Set<string>();
  const lessonIds = new Set<string>();
  for (const row of rows) {
    const collected = collectAuditDetailIds(row.oldValue, row.newValue);
    collected.pupilIds.forEach((id) => pupilIds.add(id));
    collected.lessonIds.forEach((id) => lessonIds.add(id));
  }

  const pupilLabels = new Map<string, string>();
  if (pupilIds.size) {
    const pupils = await db.pupil.findMany({
      where: { id: { in: [...pupilIds] } },
      select: { id: true, firstName: true, lastName: true, middleName: true },
    });
    for (const pupil of pupils) {
      const name = [pupil.lastName, pupil.firstName, pupil.middleName].filter(Boolean).join(" ").trim();
      pupilLabels.set(
        pupil.id,
        name.length > 0 ? name : getMessage(adminDict, "audit.entity_pupil_erased"),
      );
    }
  }

  const lessonLabels = new Map<string, string>();
  if (lessonIds.size) {
    const lessons = await db.lesson.findMany({
      where: { id: { in: [...lessonIds] } },
      select: { id: true, ordinal: true },
    });
    for (const lesson of lessons) {
      lessonLabels.set(
        lesson.id,
        getMessage(adminDict, "audit.details.lesson_context").replace("{n}", String(lesson.ordinal)),
      );
    }
  }

  return { pupilLabels, lessonLabels };
}

async function loadEntityContextSuffixes(
  db: PrismaClient,
  rows: RawAuditRow[],
  detailCtx: AuditDetailLabelContext,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const gradeIds = new Set<string>();

  for (const row of rows) {
    if (CONTEXT_BY_PUPIL_ENTITY_TYPES.has(row.entityType)) {
      const pupilId = readIdField("pupilId", row.newValue, row.oldValue);
      if (pupilId && detailCtx.pupilLabels.has(pupilId)) {
        out.set(row.id, detailCtx.pupilLabels.get(pupilId)!);
      }
      continue;
    }
    if (CONTEXT_BY_GRADE_ENTITY_TYPES.has(row.entityType)) {
      const gradeId = readIdField("gradeId", row.newValue, row.oldValue);
      if (gradeId) gradeIds.add(gradeId);
    }
  }

  if (gradeIds.size) {
    const grades = await db.grade.findMany({
      where: { id: { in: [...gradeIds] } },
      select: { id: true, name: true },
    });
    const gradeNames = new Map(grades.map((grade) => [grade.id, grade.name]));
    for (const row of rows) {
      if (!CONTEXT_BY_GRADE_ENTITY_TYPES.has(row.entityType)) continue;
      const gradeId = readIdField("gradeId", row.newValue, row.oldValue);
      if (gradeId && gradeNames.has(gradeId)) {
        out.set(row.id, gradeNames.get(gradeId)!);
      }
    }
  }

  return out;
}

export { buildAuditChangeLines };

export async function mapAuditRowsToDto(
  db: PrismaClient,
  rows: RawAuditRow[],
  adminDict: Dictionary,
  commonDict: Dictionary,
): Promise<AuditLogEntryDto[]> {
  const labels = await resolveAuditEntryLabels(db, rows, adminDict, commonDict);
  const deletedPupilLabel = getMessage(adminDict, "audit.deleted_pupil");
  const homeworkContexts = await loadHomeworkCheckContexts(db, rows, deletedPupilLabel);
  const detailCtx = await loadAuditDetailLabelContext(db, rows, adminDict);
  const contextSuffixes = await loadEntityContextSuffixes(db, rows, detailCtx);

  return rows.map((row) => {
    const resolved = labels.get(row.id)!;
    const entityTypeLabel =
      safeAdminMessage(adminDict, `audit.entity_types.${row.entityType}`) ?? row.entityType;
    const homeworkContext =
      row.entityType === AUDIT_ENTITY_TYPE.HOMEWORK_CHECK
        ? (homeworkContexts.get(row.entityId) ?? {
            pupilName: deletedPupilLabel,
            lessonOrdinal: null,
          })
        : undefined;
    const changeLines = buildAuditChangeLines(adminDict, row.oldValue, row.newValue, detailCtx);
    const actionPhrase = formatAuditActionPhrase(adminDict, row);
    const entityDisplay = buildEntityDisplay(
      adminDict,
      row,
      entityTypeLabel,
      resolved.entityLabel,
      homeworkContext,
      contextSuffixes.get(row.id),
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
      entityIdTitle: "",
      changeLines,
      isSystemEntry:
        row.source === AUDIT_SOURCE.SYSTEM || isHiddenSystemAuditAction(row.action),
      technicalRecordJson: buildTechnicalRecord(row),
      reason: row.reason,
      oldValueText: null,
      newValueText: null,
    };
  });
}
