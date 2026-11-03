"use client";

import {
  computePoints,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
} from "@sunschool/domain";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type RefObject } from "react";
import { toast } from "sonner";
import {
  completeLessonCheckAction,
  correctCheckAction,
  saveCheckedAction,
} from "@/actions/checks";
import type { CheckFormState } from "@/components/teacher/CheckCard";
import { shouldIgnoreSequentialCheckGlobalKeydown } from "@/components/teacher/sequential-check-keyboard";
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

const parseBaseline = (baseline: string): CheckFormState => JSON.parse(baseline) as CheckFormState;

type UnsavedPendingTarget =
  | { kind: "pupil"; pupilId: string }
  | { kind: "route"; href: string };

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
  const resumeFocusRef = useRef<HTMLElement | null>(null);
  const focusHeadingAfterUnsavedCloseRef = useRef(false);
  const [unsavedDialogFinalFocus, setUnsavedDialogFinalFocus] = useState<
    RefObject<HTMLElement | null> | undefined
  >(undefined);
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
  const [unsavedPending, setUnsavedPending] = useState<UnsavedPendingTarget | null>(null);

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

  const commitNavigate = useCallback((nextId: string) => {
    setActiveId(nextId);
    setPresentError(undefined);
  }, []);

  const restoreFocusAfterUnsaved = useCallback(() => {
    resumeFocusRef.current?.focus();
    resumeFocusRef.current = null;
  }, []);

  const closeUnsavedDialog = useCallback(() => {
    setUnsavedPending(null);
    restoreFocusAfterUnsaved();
  }, [restoreFocusAfterUnsaved]);

  const dismissUnsavedDialog = useCallback((restoreFocus: boolean) => {
    setUnsavedPending(null);
    if (restoreFocus) {
      restoreFocusAfterUnsaved();
    } else {
      resumeFocusRef.current = null;
    }
  }, [restoreFocusAfterUnsaved]);

  const applyPendingNavigation = useCallback(
    (target: UnsavedPendingTarget) => {
      if (target.kind === "pupil") {
        commitNavigate(target.pupilId);
      } else {
        router.push(target.href);
      }
    },
    [commitNavigate, router],
  );

  const updateActive = useCallback(
    (patch: Partial<CheckFormState>) => {
      if ("presentChoice" in patch) {
        setPresentError(undefined);
      }
      setPupils((rows) =>
        rows.map((row, index) => (index === activeIndex ? { ...row, ...patch } : row)),
      );
    },
    [activeIndex],
  );

  const moveTo = useCallback(
    (nextId: string) => {
      if (nextId === activeId) return;
      if (dirty) {
        resumeFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setUnsavedPending({ kind: "pupil", pupilId: nextId });
        return;
      }
      commitNavigate(nextId);
    },
    [activeId, commitNavigate, dirty],
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

  const performSave = useCallback(
    (options?: { fromUnsavedDialog?: boolean }) => {
      if (!activePupil || readOnly) return;

      const pendingNavigation = options?.fromUnsavedDialog ? unsavedPending : null;

      if (activePupil.presentChoice === null) {
        const presentRequiredMessage = resolveMessageKey(
          dictionaries,
          "teacher.check.present_required",
        );
        setPresentError(presentRequiredMessage);
        toast.error(presentRequiredMessage, { duration: PRODUCT_TOAST_DURATION_MS });
        if (options?.fromUnsavedDialog) {
          dismissUnsavedDialog(false);
        }
        return;
      }
      if (data.yearClosed && data.isAdmin && isCorrection && !reason.trim()) {
        toast.error(resolveMessageKey(dictionaries, "common.errors.reason_required"), {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        if (options?.fromUnsavedDialog) {
          dismissUnsavedDialog(false);
        }
        return;
      }

      const remaining = pupils.filter((p) => !p.homeworkChecked && p.pupilId !== activePupil.pupilId);
      const shouldCompleteLesson =
        !isCorrection && remaining.length === 0 && data.lessonStatus === LESSON_STATUS.HELD;

      startTransition(async () => {
        try {
          const action = isCorrection ? correctCheckAction : saveCheckedAction;
          const result = await action(buildPayload(activePupil));
          if (!result.ok) {
            if (result.code === MUTATION_ERROR_CODES.CONFLICT) {
              setConflict(true);
            }
            if (result.fields?.present) {
              const presentMessage = resolveMessageKey(dictionaries, result.fields.present);
              setPresentError(presentMessage);
              toast.error(presentMessage, { duration: PRODUCT_TOAST_DURATION_MS });
            } else {
              toast.error(
                result.message
                  ? resolveMessageKey(dictionaries, result.message)
                  : messages.formError,
                {
                  duration: PRODUCT_TOAST_DURATION_MS,
                },
              );
            }
            if (options?.fromUnsavedDialog) {
              dismissUnsavedDialog(false);
            }
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
          if (!options?.fromUnsavedDialog) {
            headingRef.current?.focus();
          }

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
              if (options?.fromUnsavedDialog) {
                dismissUnsavedDialog(false);
              }
              return;
            }
            setFinished(true);
            if (options?.fromUnsavedDialog) {
              dismissUnsavedDialog(false);
            }
            router.refresh();
            return;
          }

          if (options?.fromUnsavedDialog && pendingNavigation?.kind === "pupil") {
            focusHeadingAfterUnsavedCloseRef.current = true;
            applyPendingNavigation(pendingNavigation);
            setUnsavedDialogFinalFocus(headingRef);
            dismissUnsavedDialog(false);
          } else {
            if (pendingNavigation) {
              applyPendingNavigation(pendingNavigation);
            } else if (!isCorrection) {
              const next = remaining[0];
              if (next) {
                commitNavigate(next.pupilId);
              }
            }
            if (options?.fromUnsavedDialog) {
              dismissUnsavedDialog(false);
            }
          }
          router.refresh();
        } catch {
          toast.error(messages.formError, { duration: PRODUCT_TOAST_DURATION_MS });
          if (options?.fromUnsavedDialog) {
            dismissUnsavedDialog(false);
          }
        }
      });
    },
    [
      activePupil,
      applyPendingNavigation,
      buildPayload,
      commitNavigate,
      data,
      dictionaries,
      dismissUnsavedDialog,
      isCorrection,
      messages,
      pupils,
      readOnly,
      reason,
      router,
      unsavedPending,
    ],
  );

  const handleSave = useCallback(() => {
    performSave();
  }, [performSave]);

  const handleUnsavedDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeUnsavedDialog();
      }
    },
    [closeUnsavedDialog],
  );

  const handleUnsavedDialogOpenChangeComplete = useCallback((open: boolean) => {
    if (open) return;
    setUnsavedDialogFinalFocus(undefined);
    if (focusHeadingAfterUnsavedCloseRef.current) {
      focusHeadingAfterUnsavedCloseRef.current = false;
      headingRef.current?.focus();
    }
  }, []);

  const handleUnsavedSave = useCallback(() => {
    if (!unsavedPending) return;
    performSave({ fromUnsavedDialog: true });
  }, [performSave, unsavedPending]);

  const handleUnsavedDiscard = useCallback(() => {
    if (!unsavedPending) return;
    const target = unsavedPending;
    const baselineRow = baselines[activeIndex];
    if (!baselineRow) return;
    const baseline = parseBaseline(baselineRow);
    setPupils((rows) =>
      rows.map((row, index) => (index === activeIndex ? baseline : row)),
    );
    setUnsavedPending(null);
    resumeFocusRef.current = null;
    applyPendingNavigation(target);
    toast.success(messages.unsavedDiscarded, { duration: PRODUCT_TOAST_DURATION_MS });
  }, [
    activeIndex,
    applyPendingNavigation,
    baselines,
    messages.unsavedDiscarded,
    unsavedPending,
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
    if (!dirty) return;

    const handleClickCapture = (event: MouseEvent) => {
      if (unsavedPending !== null) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href");
      if (
        !hrefAttr ||
        hrefAttr.startsWith("#") ||
        hrefAttr.startsWith("mailto:") ||
        hrefAttr.startsWith("tel:")
      ) {
        return;
      }

      let resolved: URL;
      try {
        resolved = new URL(anchor.href);
      } catch {
        return;
      }
      if (resolved.origin !== window.location.origin) return;

      const nextHref = `${resolved.pathname}${resolved.search}${resolved.hash}`;
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextHref === currentHref) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      resumeFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setUnsavedPending({ kind: "route", href: nextHref });
    };

    document.addEventListener("click", handleClickCapture, true);
    return () => document.removeEventListener("click", handleClickCapture, true);
  }, [dirty, unsavedPending]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreSequentialCheckGlobalKeydown(event)) {
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
  }, [activeIndex, handleSave, moveTo, pupils]);

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
    unsavedDialogOpen: unsavedPending !== null,
    unsavedDialogFinalFocus,
    setReason,
    updateActive,
    moveTo,
    handleSave,
    handleUnsavedDialogOpenChange,
    handleUnsavedDialogOpenChangeComplete,
    handleUnsavedSave,
    handleUnsavedDiscard,
    finished,
    setConflict,
  };
};
