"use client";

import { ErrorState } from "@/components/patterns/ErrorState";
import { pickGlobalErrorCopy } from "@/lib/messages/global-error-copy";

type AppSegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const AppSegmentError = ({ reset }: AppSegmentErrorProps) => {
  const copy = pickGlobalErrorCopy();

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
