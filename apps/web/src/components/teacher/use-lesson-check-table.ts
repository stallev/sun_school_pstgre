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
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { correctCheckAction, savePartialCheckAction } from "@/actions/checks";
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
  const [filterUnchecked, setFilterUnchecked] = useState(false);
  const [conflictIds, setConflictIds] = useState<ReadonlySet<string>>(() => new Set());
  const [busyCells, setBusyCells] = useState<ReadonlySet<string>>(() => new Set());
  const [pending, startTransition] = useTransition();

  const readOnly = !canMutate && !(yearClosed && isAdmin);
  const lessonCorrection = lessonStatus === LESSON_STATUS.CHECK_COMPLETED;

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

      startTransition(async () => {
        const action = correction ? correctCheckAction : savePartialCheckAction;
        const result = await action({
          lessonId,
          pupilId,
          lessonKind,
          expectedUpdatedAt: previous.updatedAt ?? undefined,
          ...payload,
        });
        setBusyCells((keys) => {
          const next = new Set(keys);
          next.delete(cellKey);
          return next;
        });
        if (!result.ok) {
          patchRow(pupilId, previous);
          if (result.code === MUTATION_ERROR_CODES.CONFLICT) {
            setConflictIds((ids) => new Set(ids).add(pupilId));
          }
          toast.error(
            result.message
              ? resolveMessageKey(dictionaries, result.message)
              : messages.formError,
            { duration: PRODUCT_TOAST_DURATION_MS },
          );
          return;
        }
        patchRow(pupilId, { updatedAt: result.data.updatedAt });
        router.refresh();
      });
    },
    [
      dictionaries,
      lessonCorrection,
      lessonId,
      lessonKind,
      lessonStatus,
      messages.formError,
      patchRow,
      readOnly,
      recomputePoints,
      router,
      rows,
    ],
  );

  return {
    rows: filteredRows,
    filterPresent,
    filterUnchecked,
    setFilterPresent,
    setFilterUnchecked,
    conflictIds,
    busyCells,
    readOnly,
    lessonCorrection,
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
