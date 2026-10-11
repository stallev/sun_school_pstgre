"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Last-resort error boundary. Copy is a placeholder until the shell (P01-CU6) provides the
 * dictionary-driven version; the error goes to Sentry only when it is initialized.
 */
const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <main className="mx-auto max-w-xl p-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <button type="button" onClick={reset}>
            Retry
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
