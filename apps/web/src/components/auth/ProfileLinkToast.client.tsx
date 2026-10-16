"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export const ProfileLinkToast = () => {
  const messages = useAuthMessages();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const linked = searchParams.get("linked");
    const linkError = searchParams.get("link_error");
    if (linked !== "1" && linkError !== MUTATION_ERROR_CODES.AUTH_LINK_CONFLICT) return;

    if (linked === "1") {
      toast.success(messages.profile.linkedToast, { duration: PRODUCT_TOAST_DURATION_MS });
    } else {
      toast.error(messages.profile.linkConflict, { duration: PRODUCT_TOAST_DURATION_MS });
    }
    router.replace("/profile");
  }, [messages.profile.linkConflict, messages.profile.linkedToast, router, searchParams]);

  return null;
};
