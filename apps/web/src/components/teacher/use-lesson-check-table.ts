"use client";

import {
  computePoints,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
  type LessonKind,
  type LessonStatus,
  type LessonVerseToRecite,
  type ScoringSnapshot,
} from "@sunschool/domain";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { correctCheckAction, finishLessonTableCheckAction, savePartialCheckAction } from "@/actions/checks";
import type { LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";
import { isCorrectionMode } from "@/data/checks/sequential-check-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type UseLessonCheckTableArgs = {
  lessonId: string;
  lessonKind: LessonKind;
  lessonStatus: LessonStatus;
  canMutate: boolean;
  yearClosed: boolean;
  isAdmin: boolean;
  versesToRecite: readonly LessonVerseToRecite[];
  scoring: ScoringSnapshot;
  initialPupils: LessonTablePupilRow[];
  messages: TeacherCheckMessages;
  dictionaries: Record<string, Dictionary>;
};

type QueuedMutation = {
  pupilId: string;
  cellKey: string;
  rollbackPatch: Partial<LessonTablePupilRow>;
  payload: Record<string, unknown>;
  correction: boolean;
};

const rollbackPatchForPayload = (
  previous: LessonTablePupilRow,
  payload: Record<string, unknown>,
): Partial<LessonTablePupilRow> => {
  const rollback: Partial<LessonTablePupilRow> = {};
  if ("present" in payload) rollback.present = previous.present;
  if ("singing" in payload) rollback.singing = previous.singing;
  if ("testScore" in payload) rollback.testScore = previous.testScore;
  if ("notebookScore" in payload) rollback.notebookScore = previous.notebookScore;
  if ("verseScores" in payload && Array.isArray(payload.verseScores)) {
    const entry = payload.verseScores[0] as { lessonVerseId: string; score: number | null };
    rollback.verseScores = {
      [entry.lessonVerseId]: previous.verseScores[entry.lessonVerseId] ?? null,
    };
  }
  return rollback;
};

const applyRowPatch = (
  row: LessonTablePupilRow,
  patch: Partial<LessonTablePupilRow>,
): LessonTablePupilRow => ({
  ...row,
  ...patch,
  verseScores: patch.verseScores ? { ...row.verseScores, ...patch.verseScores } : row.verseScores,
});

export const useLessonCheckTable = ({
  lessonId,
  lessonKind,
  lessonStatus,
  canMutate,
  yearClosed,
  isAdmin,
  versesToRecite,
  scoring,
  initialPupils,
  messages,
  dictionaries,
}: UseLessonCheckTableArgs) => {
  const router = useRouter();
  const [rows, setRows] = useState(initialPupils);
  const [filterPresent, setFilterPresent] = useState(false);
  const [filterUnchecked, setFilterUnchecked] = useState(
    () =>
      lessonStatus !== LESSON_STATUS.CHECK_COMPLETED &&
      initialPupils.some((row) => !row.homeworkChecked),
  );
  const [conflictIds, setConflictIds] = useState<ReadonlySet<string>>(() => new Set());
  const [busyCells, setBusyCells] = useState<ReadonlySet<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const [finishing, startFinish] = useTransition();

  const updatedAtRef = useRef<Map<string, string | null>>(new Map());
  const mutationTailRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    for (const row of initialPupils) {
      updatedAtRef.current.set(row.pupilId, row.updatedAt ?? null);
    }
  }, [initialPupils]);

  const readOnly = !canMutate && !(yearClosed && isAdmin);
  const lessonCorrection = lessonStatus === LESSON_STATUS.CHECK_COMPLETED;
  const canFinish = !readOnly && lessonStatus === LESSON_STATUS.HELD;
  const cellsBusy = pending || busyCells.size > 0;

  const stats = useMemo(() => {
    let present = 0;
    let unchecked = 0;
    let checked = 0;
    for (const row of rows) {
      if (row.present) present += 1;
      if (row.homeworkChecked) checked += 1;
      else unchecked += 1;
    }
    return { present, unchecked, checked, total: rows.length };
  }, [rows]);

  const resetFilters = () => {
    setFilterPresent(false);
    setFilterUnchecked(false);
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filterPresent && !row.present) return false;
      if (filterUnchecked && row.homeworkChecked) return false;
      return true;
    });
  }, [rows, filterPresent, filterUnchecked]);

  const recomputePoints = useCallback(
    (row: LessonTablePupilRow): number | null => {
      if (!row.homeworkChecked) return null;
      const verseScores = versesToRecite.map((verse) => row.verseScores[verse.lessonVerseId] ?? null);
      return computePoints(
        lessonKind,
        {
          verseScores,
          testScore: row.testScore,
          notebookScore: row.notebookScore,
          singing: row.singing,
        },
        scoring.weights,
        scoring.switches,
      );
    },
    [lessonKind, scoring, versesToRecite],
  );

  const patchRow = useCallback((pupilId: string, patch: Partial<LessonTablePupilRow>) => {
    setRows((current) =>
      current.map((row) => (row.pupilId === pupilId ? { ...row, ...patch } : row)),
    );
  }, []);

  const runQueuedMutation = useCallback(
    (job: QueuedMutation) => {
      const prior = mutationTailRef.current.get(job.pupilId) ?? Promise.resolve();
      const next = prior
        .then(async () => {
          const expectedUpdatedAt = updatedAtRef.current.get(job.pupilId) ?? undefined;
          const action = job.correction ? correctCheckAction : savePartialCheckAction;
          const result = await action({
            lessonId,
            pupilId: job.pupilId,
            lessonKind,
            expectedUpdatedAt: expectedUpdatedAt ?? undefined,
            ...job.payload,
          });
          setBusyCells((keys) => {
            const updated = new Set(keys);
            updated.delete(job.cellKey);
            return updated;
          });
          if (!result.ok) {
            setRows((current) =>
              current.map((row) =>
                row.pupilId === job.pupilId ? applyRowPatch(row, job.rollbackPatch) : row,
              ),
            );
            if (result.code === MUTATION_ERROR_CODES.CONFLICT) {
              setConflictIds((ids) => new Set(ids).add(job.pupilId));
            }
            toast.error(
              result.message
                ? resolveMessageKey(dictionaries, result.message)
                : messages.formError,
              { duration: PRODUCT_TOAST_DURATION_MS },
            );
            return;
          }
          updatedAtRef.current.set(job.pupilId, result.data.updatedAt);
          patchRow(job.pupilId, { updatedAt: result.data.updatedAt });
          router.refresh();
        })
        .catch(() => {
          setBusyCells((keys) => {
            const updated = new Set(keys);
            updated.delete(job.cellKey);
            return updated;
          });
          setRows((current) =>
            current.map((row) =>
              row.pupilId === job.pupilId ? applyRowPatch(row, job.rollbackPatch) : row,
            ),
          );
          toast.error(messages.formError, { duration: PRODUCT_TOAST_DURATION_MS });
        });
      mutationTailRef.current.set(job.pupilId, next);
    },
    [dictionaries, lessonId, lessonKind, messages.formError, patchRow, router],
  );

  const mutateField = useCallback(
    (
      pupilId: string,
      cellKey: string,
      applyOptimistic: (row: LessonTablePupilRow) => Partial<LessonTablePupilRow>,
      payload: Record<string, unknown>,
    ) => {
      if (readOnly) return;
      const row = rows.find((entry) => entry.pupilId === pupilId);
      if (!row) return;

      const correction = lessonCorrection || isCorrectionMode(lessonStatus, row.homeworkChecked);
      const previous = { ...row, verseScores: { ...row.verseScores } };
      const patch = applyOptimistic(row);
      const optimistic: LessonTablePupilRow = {
        ...row,
        ...patch,
        verseScores: patch.verseScores
          ? { ...row.verseScores, ...patch.verseScores }
          : row.verseScores,
      };
      if (optimistic.homeworkChecked) {
        optimistic.pointsTotal = recomputePoints(optimistic);
      }
      patchRow(pupilId, optimistic);
      setBusyCells((keys) => new Set(keys).add(cellKey));
      setConflictIds((ids) => {
        const next = new Set(ids);
        next.delete(pupilId);
        return next;
      });

      startTransition(() => {
        runQueuedMutation({
          pupilId,
          cellKey,
          rollbackPatch: rollbackPatchForPayload(previous, payload),
          payload,
          correction,
        });
      });
    },
    [lessonCorrection, lessonStatus, patchRow, readOnly, recomputePoints, rows, runQueuedMutation],
  );

  const finishCheck = useCallback(() => {
    if (!canFinish || cellsBusy || finishing) return;
    startFinish(async () => {
      try {
        const result = await finishLessonTableCheckAction({ lessonId });
        if (!result.ok) {
          toast.error(
            result.message ? resolveMessageKey(dictionaries, result.message) : messages.formError,
            { duration: PRODUCT_TOAST_DURATION_MS },
          );
          return;
        }
        toast.success(messages.finishedTitle, { duration: PRODUCT_TOAST_DURATION_MS });
        router.refresh();
      } catch {
        toast.error(messages.formError, { duration: PRODUCT_TOAST_DURATION_MS });
      }
    });
  }, [
    canFinish,
    cellsBusy,
    dictionaries,
    finishing,
    lessonId,
    messages.finishedTitle,
    messages.formError,
    router,
  ]);

  return {
    rows: filteredRows,
    stats,
    filterPresent,
    filterUnchecked,
    setFilterPresent,
    setFilterUnchecked,
    resetFilters,
    conflictIds,
    busyCells,
    readOnly,
    lessonCorrection,
    canFinish,
    finishing,
    cellsBusy,
    finishCheck,
    pending,
    mutatePresent: (pupilId: string, present: boolean) =>
      mutateField(pupilId, `${pupilId}:present`, () => ({ present }), { present }),
    mutateSinging: (pupilId: string, singing: boolean) =>
      mutateField(pupilId, `${pupilId}:singing`, () => ({ singing }), { singing }),
    mutateTestScore: (pupilId: string, testScore: number | null) =>
      mutateField(pupilId, `${pupilId}:test`, () => ({ testScore }), { testScore }),
    mutateNotebookScore: (pupilId: string, notebookScore: number | null) =>
      mutateField(pupilId, `${pupilId}:notebook`, () => ({ notebookScore }), { notebookScore }),
    mutateVerseScore: (pupilId: string, lessonVerseId: string, score: number | null) =>
      mutateField(
        pupilId,
        `${pupilId}:verse:${lessonVerseId}`,
        (row) => ({ verseScores: { ...row.verseScores, [lessonVerseId]: score } }),
        { verseScores: [{ lessonVerseId, score }] },
      ),
  };
};
