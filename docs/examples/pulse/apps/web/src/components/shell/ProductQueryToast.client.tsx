"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  PRODUCT_TOAST_DURATION_MS,
  PRODUCT_TOAST_QUERY_KEYS,
} from "@/lib/ui/product-toast";

export function ProductQueryToast() {
  const messages = useMessages();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const saved = searchParams.get(PRODUCT_TOAST_QUERY_KEYS.saved);
    const booked = searchParams.get(PRODUCT_TOAST_QUERY_KEYS.booked);
    const reviewed = searchParams.get(PRODUCT_TOAST_QUERY_KEYS.reviewed);

    if (saved) {
      toast.success(messages.toast.saved, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete(PRODUCT_TOAST_QUERY_KEYS.saved);
      const query = nextParams.toString();
      router.replace(query ? `?${query}` : ".", { scroll: false });
      return;
    }

    if (booked) {
      toast.success(messages.toast.booked, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete(PRODUCT_TOAST_QUERY_KEYS.booked);
      const query = nextParams.toString();
      router.replace(query ? `?${query}` : ".", { scroll: false });
      return;
    }

    if (!reviewed) {
      return;
    }

    toast.success(messages.toast.reviewPublished, {
      duration: PRODUCT_TOAST_DURATION_MS,
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(PRODUCT_TOAST_QUERY_KEYS.reviewed);
    const query = nextParams.toString();
    router.replace(query ? `?${query}` : ".", { scroll: false });
  }, [router, searchParams]);

  return null;
}
