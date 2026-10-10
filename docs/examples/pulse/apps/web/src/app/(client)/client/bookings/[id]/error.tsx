"use client";

import { RouteSegmentError } from "@/components/shell/RouteSegmentError";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export default function ClientBookingDetailError({
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  const messages = useMessages();

  return (
    <RouteSegmentError
      pageTitle={messages.booking.detail.title}
      title={messages.common.segmentError.title}
      description={messages.common.segmentError.description}
      retryLabel={messages.common.segmentError.retry}
      retry={retry}
    />
  );
}
