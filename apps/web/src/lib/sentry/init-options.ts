import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";
import { sentryBeforeSend } from "@/lib/observability/scrub";
import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryTracesSampleRate,
  isSentryEnabled,
} from "@/lib/sentry/config";

function sharedInitFields() {
  return {
    dsn: getSentryDsn(),
    environment: getSentryEnvironment(),
    tracesSampleRate: getSentryTracesSampleRate(),
    beforeSend: sentryBeforeSend,
  };
}

export function buildServerSentryOptions(): NodeOptions | undefined {
  if (!isSentryEnabled()) return undefined;
  return sharedInitFields();
}

export function buildEdgeSentryOptions(): EdgeOptions | undefined {
  if (!isSentryEnabled()) return undefined;
  return sharedInitFields();
}

export function buildClientSentryOptions(): BrowserOptions | undefined {
  if (!isSentryEnabled()) return undefined;
  return sharedInitFields();
}
