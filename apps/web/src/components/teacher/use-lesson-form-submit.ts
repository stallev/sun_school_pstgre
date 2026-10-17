"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type UseLessonFormSubmitOptions = {
  state: MutationResult<{ lessonId: string }> | MutationResult | null;
  mode: "create" | "edit";
  dictionaries: Record<string, Dictionary>;
  formError: string;
  toastCreated: string;
  toastUpdated: string;
  lessonId?: string;
  onServerMissing?: () => void;
};

export const useLessonFormSubmit = ({
  state,
  mode,
  dictionaries,
  formError,
  toastCreated,
  toastUpdated,
  lessonId,
  onServerMissing,
}: UseLessonFormSubmitOptions): void => {
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      const message = mode === "create" ? toastCreated : toastUpdated;
      toast.success(message, { duration: PRODUCT_TOAST_DURATION_MS });
      const createdId =
        "data" in state && state.data && typeof state.data === "object" && "lessonId" in state.data
          ? state.data.lessonId
          : null;
      const targetId = createdId ?? lessonId;
      if (targetId) {
        router.push(`/lessons/${targetId}`);
      } else {
        router.refresh();
      }
      return;
    }
    const message = state.message
      ? resolveMessageKey(dictionaries, state.message)
      : formError;
    toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
    if (state.code === MUTATION_ERROR_CODES.CHECK_VERSE_MISSING) {
      onServerMissing?.();
    }
  }, [
    state,
    mode,
    dictionaries,
    formError,
    toastCreated,
    toastUpdated,
    lessonId,
    onServerMissing,
    router,
  ]);
};
