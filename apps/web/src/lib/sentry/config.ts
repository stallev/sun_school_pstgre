const REDACTED_PLACEHOLDER = "[Filtered]";

export function getSentryDsn(): string | undefined {
  const fromPublic = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (fromPublic) return fromPublic;
  const fromServer = process.env.SENTRY_DSN?.trim();
  return fromServer || undefined;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}

export function getSentryEnvironment(): string {
  const appEnv = process.env.APP_ENV?.trim();
  if (appEnv) return appEnv;
  return process.env.NODE_ENV ?? "development";
}

/**
 * Trace sample rate 0…1 from `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`; invalid or missing → 0.
 * Use a lower value on Vercel prod (e.g. 0.1); `1` traces every request locally.
 */
export function getSentryTracesSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE?.trim();
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return 0;
  return parsed;
}

export { REDACTED_PLACEHOLDER };
