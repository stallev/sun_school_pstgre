import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import { safeAdminMessage } from "@/lib/messages/safe-admin-message";

export type AuditDetailLabelContext = {
  pupilLabels: Map<string, string>;
  lessonLabels: Map<string, string>;
};

const RESOLVED_ID_FIELDS = new Set(["pupilId", "lessonId"]);

export const isHiddenAuditDetailField = (field: string): boolean => {
  if (RESOLVED_ID_FIELDS.has(field)) return false;
  if (field.endsWith("Id") || field.endsWith("_id")) return true;
  if (field === "verify" || field === "verseScores") return true;
  return false;
};

export const collectAuditDetailIds = (
  oldValue: unknown,
  newValue: unknown,
): { pupilIds: Set<string>; lessonIds: Set<string> } => {
  const pupilIds = new Set<string>();
  const lessonIds = new Set<string>();
  const readObject = (raw: unknown) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const record = raw as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== "string") continue;
      if (key === "pupilId") pupilIds.add(value);
      if (key === "lessonId") lessonIds.add(value);
    }
  };
  readObject(oldValue);
  readObject(newValue);
  return { pupilIds, lessonIds };
};

function auditDetailFieldLabel(adminDict: Dictionary, field: string): string | null {
  return safeAdminMessage(adminDict, `audit.details.${field}`);
}

function formatScalarDetailValue(adminDict: Dictionary, field: string, value: unknown): string {
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
  return getMessage(adminDict, "audit.details.empty");
}

function formatResolvedIdLine(
  adminDict: Dictionary,
  field: string,
  value: unknown,
  ctx: AuditDetailLabelContext,
): string | null {
  if (typeof value !== "string") return null;
  if (field === "pupilId") {
    const name = ctx.pupilLabels.get(value);
    if (!name) return null;
    const template = getMessage(adminDict, "audit.details.pupil_context");
    return template.replace("{name}", name);
  }
  if (field === "lessonId") {
    const label = ctx.lessonLabels.get(value);
    if (!label) return null;
    return label;
  }
  return null;
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
    lines.push(`${label}: ${formatScalarDetailValue(adminDict, "score", pair.next ?? pair.old)}`);
    index += 1;
  }
  return lines;
}

export function buildAuditChangeLines(
  adminDict: Dictionary,
  oldValue: unknown,
  newValue: unknown,
  ctx: AuditDetailLabelContext = { pupilLabels: new Map(), lessonLabels: new Map() },
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

  const lines: string[] = [...verseLines];
  for (const key of keys) {
    if (isHiddenAuditDetailField(key)) continue;
    const oldPart = oldObj[key];
    const newPart = newObj[key];
    if (JSON.stringify(oldPart) === JSON.stringify(newPart)) continue;

    if (RESOLVED_ID_FIELDS.has(key)) {
      const resolved = formatResolvedIdLine(adminDict, key, newPart ?? oldPart, ctx);
      if (resolved) {
        lines.push(resolved);
        continue;
      }
      continue;
    }

    if (typeof newPart === "object" || typeof oldPart === "object") {
      continue;
    }

    const label = auditDetailFieldLabel(adminDict, key);
    if (!label) continue;

    const displayValue =
      newPart !== undefined
        ? formatScalarDetailValue(adminDict, key, newPart)
        : formatScalarDetailValue(adminDict, key, oldPart);
    lines.push(`${label}: ${displayValue}`);
  }

  if (lines.length === 0 && (oldValue !== null || newValue !== null)) {
    return [getMessage(adminDict, "audit.details.empty")];
  }
  return lines;
}

export const stripShortIdSuffix = (label: string): string =>
  label.replace(/\s\([0-9a-f]{8}\)$/i, "").trim();
