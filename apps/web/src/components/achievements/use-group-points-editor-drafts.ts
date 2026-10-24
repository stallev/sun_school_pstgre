"use client";

import { useMemo, useState } from "react";
import type { GroupPointsEditorData } from "@/data/achievements/load-group-points-page.server";
import {
  buildDraftsFromRows,
  buildEditorRowsSnapshot,
  groupPointsHasDraftChanges,
} from "@/lib/achievements/group-points-drafts";

const buildEditorSyncKey = (editor: GroupPointsEditorData): string =>
  `${editor.gradeId}|${editor.academicYearId}|${buildEditorRowsSnapshot(editor.rows)}`;

export const useGroupPointsEditorDrafts = (editor: GroupPointsEditorData) => {
  const syncKey = buildEditorSyncKey(editor);

  const [syncedKey, setSyncedKey] = useState(syncKey);
  const [drafts, setDrafts] = useState(() => buildDraftsFromRows(editor.rows));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (syncedKey !== syncKey) {
    setSyncedKey(syncKey);
    setDrafts(buildDraftsFromRows(editor.rows));
    setFieldErrors({});
  }

  const hasChanges = useMemo(
    () => groupPointsHasDraftChanges(editor.rows, drafts),
    [drafts, editor.rows],
  );

  return {
    drafts,
    setDrafts,
    fieldErrors,
    setFieldErrors,
    hasChanges,
  };
};
