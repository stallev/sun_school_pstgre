"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/dictionary-types";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { useMutationResultEffect } from "@/lib/ui/use-mutation-result-effects";

type AdminFormMutationOptions = {
  state: MutationResult | null;
  dictionaries: Record<string, Dictionary>;
  successMessage: string;
  formErrorFallback: string;
  onSuccess?: () => void;
};

export const useAdminFormMutation = ({
  state,
  dictionaries,
  successMessage,
  formErrorFallback,
  onSuccess,
}: AdminFormMutationOptions): void => {
  const router = useRouter();

  useMutationResultEffect(state, (result) => {
    if (result.ok) {
      toast.success(successMessage, { duration: PRODUCT_TOAST_DURATION_MS });
      onSuccess?.();
      router.refresh();
      return;
    }
    const message = result.message
      ? resolveMessageKey(dictionaries, result.message)
      : formErrorFallback;
    toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
    if (result.code === MUTATION_ERROR_CODES.ACCESS_REQUEST_DECIDED) {
      router.refresh();
    }
  });
};
