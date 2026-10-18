"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export const ProfileLinkToast = () => {
  const messages = useAuthMessages();
  const searchParams = useSearchParams();
  const router = useRouter();
  const linked = searchParams.get("linked");
  const linkError = searchParams.get("link_error");
  const handledKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const isSuccess = linked === "1";
    const isConflict = linkError === MUTATION_ERROR_CODES.AUTH_LINK_CONFLICT;
    if (!isSuccess && !isConflict) return;

    const key = isSuccess ? "linked:1" : `link_error:${linkError}`;
    if (handledKeyRef.current === key) return;
    handledKeyRef.current = key;

    if (isSuccess) {
      toast.success(messages.profile.linkedToast, { duration: PRODUCT_TOAST_DURATION_MS });
    } else {
      toast.error(messages.profile.linkConflict, { duration: PRODUCT_TOAST_DURATION_MS });
    }
    router.replace("/profile");
  }, [linked, linkError, messages.profile.linkConflict, messages.profile.linkedToast, router]);

  return null;
};
