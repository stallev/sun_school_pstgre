"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type PendingSubmittedToastProps = {
  message: string;
};

export const PendingSubmittedToast = ({ message }: PendingSubmittedToastProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submitted = searchParams.get("submitted");
  const handledRef = useRef(false);

  useEffect(() => {
    if (submitted !== "1" || handledRef.current) return;
    handledRef.current = true;
    toast.success(message, { duration: PRODUCT_TOAST_DURATION_MS });
    router.replace("/pending");
  }, [message, router, submitted]);

  return null;
};
