"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { useMutationResultEffect } from "@/lib/ui/use-mutation-result-effects";

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

  useMutationResultEffect(state, (result) => {
    if (result.ok) {
      const message = mode === "create" ? toastCreated : toastUpdated;
      toast.success(message, { duration: PRODUCT_TOAST_DURATION_MS });
      const createdId =
        "data" in result && result.data && typeof result.data === "object" && "lessonId" in result.data
          ? result.data.lessonId
          : null;
      const targetId = createdId ?? lessonId;
      if (targetId) {
        router.push(`/lessons/${targetId}`);
      } else {
        router.refresh();
      }
      return;
    }
    const message = result.message ? resolveMessageKey(dictionaries, result.message) : formError;
    toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
    if (result.code === MUTATION_ERROR_CODES.CHECK_VERSE_MISSING) {
      onServerMissing?.();
    }
  });
};
