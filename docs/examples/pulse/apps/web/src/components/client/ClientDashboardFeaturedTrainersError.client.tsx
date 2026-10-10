"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/SectionHeader";

import { useMessages } from "@/components/i18n/LocaleProvider.client";


export function ClientDashboardFeaturedTrainersError() {
  const messages = useMessages();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <section>
      <SectionHeader title={messages.dashboard.client.topTrainersTitle} />
      <ContentText variant="muted" as="p">
        {messages.dashboard.client.topTrainersError}
      </ContentText>
      <Button
        type="button"
        variant="outline"
        className="mt-3 min-h-11"
        disabled={pending}
        aria-busy={pending}
        onClick={handleRetry}
      >
        {pending
          ? messages.landing.featured.error.retrying
          : messages.common.segmentError.retry}
      </Button>
    </section>
  );
}
