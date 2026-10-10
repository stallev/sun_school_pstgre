"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export function LandingFeaturedTrainersRetryButton() {
  const messages = useMessages();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      {isPending
        ? messages.landing.featured.error.retrying
        : messages.landing.featured.error.retry}
    </Button>
  );
}
