"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { pickGlobalErrorCopy } from "@/lib/messages/global-error-copy";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  const copy = pickGlobalErrorCopy();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <main className="mx-auto max-w-xl p-8 text-center">
          <h1 className="font-display text-xl font-semibold text-ink">{copy.title}</h1>
          <button
            type="button"
            className="mt-4 rounded-lg border border-line bg-surface px-4 py-2 text-ink"
            onClick={reset}
          >
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
