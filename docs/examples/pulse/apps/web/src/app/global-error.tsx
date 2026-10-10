"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { ContentText, Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main
          id="main-content"
          className="flex min-h-dvh flex-col items-center justify-center px-4 py-16"
        >
          <div className="mx-auto max-w-md text-center">
            <Heading as="h1" visualLevel="h2">
              Something went wrong
            </Heading>
            <ContentText variant="bodyMuted" className="mt-3">
              An unexpected error occurred. You can try again or return to the home page.
            </ContentText>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button type="button" onClick={() => reset()}>
                Try again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Go home</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
