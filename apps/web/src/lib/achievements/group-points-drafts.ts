import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";

export const initialDraft = (row: GroupPointsTableRowDto): string => {
  if (row.overridePoints === null) return "";
  if (row.isPenalty) return String(Math.abs(row.overridePoints));
  return String(row.overridePoints);
};

export const buildEditorRowsSnapshot = (rows: GroupPointsTableRowDto[]): string =>
  rows.map((row) => `${row.rowKey}:${row.overridePoints}`).join("|");

export const buildDraftsFromRows = (
  rows: GroupPointsTableRowDto[],
): Record<string, string> =>
  Object.fromEntries(rows.map((row) => [row.rowKey, initialDraft(row)]));

export const rowDiffers = (row: GroupPointsTableRowDto, draft: string): boolean => {
  const trimmed = draft.trim();
  if (trimmed === "") return row.overridePoints !== null;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return true;
  const next = row.isPenalty ? -Math.abs(parsed) : parsed;
  return next !== row.globalPoints;
};

export const groupPointsHasDraftChanges = (
  rows: GroupPointsTableRowDto[],
  drafts: Record<string, string>,
): boolean =>
  rows.some((row) => {
    const draft = drafts[row.rowKey] ?? "";
    const trimmed = draft.trim();
    const initial = initialDraft(row);
    if (trimmed === initial) return false;
    if (trimmed === "" && row.overridePoints === null) return false;
    return true;
  });

export type GroupPointsSaveItem = {
  achievementId: string;
  tier: number;
  points: number | null;
};

export const collectGroupPointsSaveItems = (
  rows: GroupPointsTableRowDto[],
  drafts: Record<string, string>,
  formErrorMessage: string,
): { items: GroupPointsSaveItem[]; fieldErrors: Record<string, string> } => {
  const items: GroupPointsSaveItem[] = [];
  const fieldErrors: Record<string, string> = {};

  for (const row of rows) {
    if (row.readOnly) continue;
    const draft = (drafts[row.rowKey] ?? "").trim();
    const initial = initialDraft(row);
    if (draft === initial) continue;

    if (draft === "") {
      if (row.overridePoints !== null) {
        items.push({ achievementId: row.achievementId, tier: row.tier, points: null });
      }
      continue;
    }

    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      fieldErrors[row.rowKey] = formErrorMessage;
      continue;
    }
    const points = row.isPenalty ? -Math.abs(parsed) : parsed;
    const normalized = points === row.globalPoints ? null : points;
    if (normalized === row.overridePoints) continue;
    items.push({ achievementId: row.achievementId, tier: row.tier, points: normalized });
  }

  return { items, fieldErrors };
};
