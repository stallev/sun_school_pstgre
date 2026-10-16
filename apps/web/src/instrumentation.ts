import * as Sentry from "@sentry/nextjs";

/**
 * Sentry loads from runtime-specific configs when a DSN is set (`NEXT_PUBLIC_SENTRY_DSN` or
 * `SENTRY_DSN`). Without DSN, dev and CI skip initialization. PII is scrubbed in `beforeSend`
 * (see `lib/observability/scrub.ts`). Source maps upload uses `withSentryConfig` when
 * `SENTRY_AUTH_TOKEN` is present at build time.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
