"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@/components/patterns/ErrorState";
import { pickGlobalErrorCopy } from "@/lib/messages/global-error-copy";

type AppSegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const AppSegmentError = ({ error, reset }: AppSegmentErrorProps) => {
  const copy = pickGlobalErrorCopy();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorState
      title={copy.title}
      action={
        <button
          type="button"
          className="rounded-lg border border-line bg-surface px-4 py-2 text-ink"
          onClick={reset}
        >
          {copy.retry}
        </button>
      }
    />
  );
};

export default AppSegmentError;
