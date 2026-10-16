"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

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

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(successMessage, { duration: PRODUCT_TOAST_DURATION_MS });
      onSuccess?.();
      router.refresh();
      return;
    }
    const message = state.message
      ? resolveMessageKey(dictionaries, state.message)
      : formErrorFallback;
    toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
    if (state.code === MUTATION_ERROR_CODES.ACCESS_REQUEST_DECIDED) {
      router.refresh();
    }
  }, [state, dictionaries, successMessage, formErrorFallback, onSuccess, router]);
};
