"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type PendingSubmittedToastProps = {
  message: string;
};

export const PendingSubmittedToast = ({ message }: PendingSubmittedToastProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("submitted") !== "1") return;
    toast.success(message, { duration: PRODUCT_TOAST_DURATION_MS });
    router.replace("/pending");
  }, [message, router, searchParams]);

  return null;
};
