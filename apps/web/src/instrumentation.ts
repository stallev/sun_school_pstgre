import * as Sentry from "@sentry/nextjs";

/**
 * Sentry stub (module `sentry`). Initialization is conditional on SENTRY_DSN, so dev and CI run
 * without it. Source-map upload (SENTRY_AUTH_TOKEN, withSentryConfig) is added in P07 with the
 * prod configuration. Personal data is never attached (do not enable PII options; INV-23).
 */
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV,
    tracesSampleRate: 0,
  });
}

export const onRequestError = Sentry.captureRequestError;
