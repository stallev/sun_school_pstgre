"use client";

import {
  computePoints,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
} from "@sunschool/domain";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  completeLessonCheckAction,
  correctCheckAction,
  saveCheckedAction,
} from "@/actions/checks";
import type { CheckFormState } from "@/components/teacher/CheckCard";
import {
  isCorrectionMode,
  type SequentialCheckPageData,
  type SequentialCheckPupil,
} from "@/data/checks/sequential-check-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

const toFormState = (pupil: SequentialCheckPupil): CheckFormState => ({
  ...pupil,
  presentChoice: pupil.present,
});

const snapshot = (pupil: CheckFormState): string => JSON.stringify(pupil);

type UseSequentialCheckArgs = {
  data: Extract<SequentialCheckPageData, { kind: "page" }>;
  initialPupilId: string | null;
  messages: TeacherCheckMessages;
  dictionaries: Record<string, Dictionary>;
};

export const useSequentialCheck = ({
  data,
  initialPupilId,
  messages,
  dictionaries,
}: UseSequentialCheckArgs) => {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [pupils, setPupils] = useState(() => data.pupils.map(toFormState));
  const [activeId, setActiveId] = useState(() => {
    if (initialPupilId && data.pupils.some((p) => p.pupilId === initialPupilId)) {
      return initialPupilId;
    }
    const firstOpen = data.pupils.find((p) => !p.homeworkChecked);
    return firstOpen?.pupilId ?? data.pupils[0]?.pupilId ?? "";
  });
  const [baselines, setBaselines] = useState(() => data.pupils.map((p) => snapshot(toFormState(p))));
  const [reason, setReason] = useState(messages.reasonLate);
  const [finished, setFinished] = useState(false);
  const [presentError, setPresentError] = useState<string | undefined>();
  const [conflict, setConflict] = useState(false);
  const [pending, startTransition] = useTransition();
  const [liveMessage, setLiveMessage] = useState("");

  const activeIndex = pupils.findIndex((p) => p.pupilId === activeId);
  const activePupil = pupils[activeIndex];
  const lessonCorrection = data.lessonStatus === LESSON_STATUS.CHECK_COMPLETED;
  const pupilCorrection = activePupil ? isCorrectionMode(data.lessonStatus, activePupil.homeworkChecked) : false;
  const isCorrection = lessonCorrection || pupilCorrection;
  const showForm = data.canMutate || (data.yearClosed && data.isAdmin);
  const readOnly = !showForm;

  const checkedCount = pupils.filter((p) => p.homeworkChecked).length;
  const dirty = activePupil ? snapshot(activePupil) !== baselines[activeIndex] : false;

  const pointsPreview = useMemo(() => {
    if (!activePupil) return 0;
    const verseScores = data.versesToRecite.map(
      (verse) => activePupil.verseScores[verse.lessonVerseId] ?? null,
    );
    return computePoints(
      data.lessonKind,
      {
        verseScores,
        testScore: activePupil.testScore,
        notebookScore: activePupil.notebookScore,
        singing: activePupil.singing,
      },
      data.scoring.weights,
      data.scoring.switches,
    );
  }, [activePupil, data]);

  const updateActive = useCallback((patch: Partial<CheckFormState>) => {
    setPupils((rows) =>
      rows.map((row, index) => (index === activeIndex ? { ...row, ...patch } : row)),
    );
  }, [activeIndex]);

  const moveTo = useCallback(
    (nextId: string) => {
      if (dirty) {
        const choice = window.confirm(messages.unsavedConfirmTitle);
        if (!choice) return;
      }
      setActiveId(nextId);
      setPresentError(undefined);
    },
    [dirty, messages.unsavedConfirmTitle],
  );

  const buildPayload = useCallback(
    (pupil: CheckFormState) => ({
      lessonId: data.lessonId,
      pupilId: pupil.pupilId,
      lessonKind: data.lessonKind,
      present: pupil.presentChoice ?? false,
      testScore: pupil.testScore,
      notebookScore: pupil.notebookScore,
      singing: pupil.singing,
      comment: pupil.comment || undefined,
      verseScores: data.versesToRecite.map((verse) => ({
        lessonVerseId: verse.lessonVerseId,
        score: pupil.verseScores[verse.lessonVerseId] ?? null,
      })),
      expectedUpdatedAt: pupil.updatedAt ?? undefined,
      ...(isCorrection ? { reason } : {}),
    }),
    [data.lessonId, data.lessonKind, data.versesToRecite, isCorrection, reason],
  );

  const handleSave = useCallback(() => {
    if (!activePupil || readOnly) return;
    if (activePupil.presentChoice === null) {
      setPresentError(resolveMessageKey(dictionaries, "teacher.check.present_required"));
      return;
    }
    if (data.yearClosed && data.isAdmin && isCorrection && !reason.trim()) {
      toast.error(resolveMessageKey(dictionaries, "common.errors.reason_required"), {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      return;
    }

    const remaining = pupils.filter((p) => !p.homeworkChecked && p.pupilId !== activePupil.pupilId);
    const shouldCompleteLesson =
      !isCorrection && remaining.length === 0 && data.lessonStatus === LESSON_STATUS.HELD;

    startTransition(async () => {
      const action = isCorrection ? correctCheckAction : saveCheckedAction;
      const result = await action(buildPayload(activePupil));
      if (!result.ok) {
        if (result.code === MUTATION_ERROR_CODES.CONFLICT) {
          setConflict(true);
        }
        toast.error(
          result.message
            ? resolveMessageKey(dictionaries, result.message)
            : messages.formError,
          {
            duration: PRODUCT_TOAST_DURATION_MS,
          },
        );
        return;
      }
      setConflict(false);
      setPupils((rows) => {
        const next = rows.map((row) =>
          row.pupilId === activePupil.pupilId
            ? {
                ...row,
                homeworkChecked: true,
                updatedAt: result.data.updatedAt,
                present: row.presentChoice ?? row.present,
              }
            : row,
        );
        setBaselines(next.map((row) => snapshot(row)));
        return next;
      });
      const savedToastText = fillMessage(messages.savedToast, { name: activePupil.displayName });
      toast.success(savedToastText, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      setLiveMessage(savedToastText);
      headingRef.current?.focus();

      if (shouldCompleteLesson) {
        const complete = await completeLessonCheckAction({ lessonId: data.lessonId });
        if (!complete.ok) {
          toast.error(
            complete.message
              ? resolveMessageKey(dictionaries, complete.message)
              : messages.formError,
            {
              duration: PRODUCT_TOAST_DURATION_MS,
            },
          );
          return;
        }
        setFinished(true);
        router.refresh();
        return;
      }

      const next = remaining[0];
      if (!isCorrection && next) {
        setActiveId(next.pupilId);
      }
      router.refresh();
    });
  }, [
    activePupil,
    buildPayload,
    data,
    dictionaries,
    isCorrection,
    messages,
    pupils,
    readOnly,
    reason,
    router,
  ]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        handleSave();
      }
      if (event.key === "ArrowLeft") {
        const prev = pupils[activeIndex - 1];
        if (prev) moveTo(prev.pupilId);
      }
      if (event.key === "ArrowRight") {
        const next = pupils[activeIndex + 1];
        if (next) moveTo(next.pupilId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, handleSave, isCorrection, moveTo, pupils]);

  const primaryLabel = isCorrection
    ? messages.saveCorrection
    : pupils.filter((p) => !p.homeworkChecked).length <= 1 && !activePupil?.homeworkChecked
      ? messages.completeCheck
      : messages.saveNext;

  return {
    pupils,
    activePupil,
    activeIndex,
    headingRef,
    isCorrection,
    readOnly,
    showForm,
    checkedCount,
    dirty,
    pending,
    presentError,
    conflict,
    liveMessage,
    reason,
    pointsPreview,
    primaryLabel,
    setReason,
    updateActive,
    moveTo,
    setActiveId,
    handleSave,
    finished,
    setConflict,
  };
};
