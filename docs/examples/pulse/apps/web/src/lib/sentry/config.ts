export function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}

export const SENTRY_TRACES_SAMPLE_RATE =
  process.env.NODE_ENV === "development" ? 1.0 : 0.1;

export function getSentryEnvironment(): string {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV;
  }

  return process.env.NODE_ENV;
}
