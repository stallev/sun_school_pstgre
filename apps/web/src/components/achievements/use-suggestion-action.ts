"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/dictionary-types";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type SuggestionActionKind = "confirm" | "defer" | "dismiss";

type UseSuggestionActionOptions = {
  dictionaries: Record<string, Dictionary>;
  formErrorFallback: string;
  /** Called on success and when the suggestion was already resolved elsewhere. */
  onDone: () => void;
};

/** Runs a confirm / defer / dismiss mutation with pending kind, toasts (2 s) and a panel refresh. */
export const useSuggestionAction = ({
  dictionaries,
  formErrorFallback,
  onDone,
}: UseSuggestionActionOptions) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeKind, setActiveKind] = useState<SuggestionActionKind | null>(null);

  const run = (
    kind: SuggestionActionKind,
    action: () => Promise<MutationResult<unknown>>,
    successMessage: string,
  ) => {
    setActiveKind(kind);
    startTransition(async () => {
      let result: MutationResult<unknown>;
      try {
        result = await action();
      } catch {
        setActiveKind(null);
        toast.error(formErrorFallback, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }
      setActiveKind(null);
      if (result.ok) {
        toast.success(successMessage, { duration: PRODUCT_TOAST_DURATION_MS });
        onDone();
        router.refresh();
        return;
      }
      const message = result.message
        ? resolveMessageKey(dictionaries, result.message)
        : formErrorFallback;
      toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
      if (result.code === MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_RESOLVED) {
        onDone();
        router.refresh();
      }
    });
  };

  return { pending, activeKind, run };
};
