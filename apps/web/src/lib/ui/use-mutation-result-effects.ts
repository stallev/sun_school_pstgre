"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { MutationResult } from "@sunschool/domain";

/** True when `state` is a new action result that has not been handled yet. */
export const shouldProcessMutationState = (
  lastHandled: MutationResult | null | undefined,
  state: MutationResult | null,
): state is MutationResult => state !== null && state !== lastHandled;

/**
 * Runs a side effect (toast, refresh, redirect) once per distinct `useActionState` result.
 * `useActionState` keeps the last result across `router.refresh()`; unstable effect deps must not re-fire toasts.
 */
export const useMutationResultEffect = (
  state: MutationResult | null,
  onResult: (result: MutationResult) => void,
): void => {
  const handledStateRef = useRef<MutationResult | null>(null);
  const onResultRef = useRef(onResult);
  useLayoutEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (!shouldProcessMutationState(handledStateRef.current, state)) return;
    handledStateRef.current = state;
    onResultRef.current(state);
  }, [state]);
};
