import * as Sentry from "@sentry/nextjs";

import {
  getSentryDsn,
  getSentryEnvironment,
  isSentryEnabled,
  SENTRY_TRACES_SAMPLE_RATE,
} from "@/lib/sentry/config";

if (isSentryEnabled()) {
  Sentry.init({
    dsn: getSentryDsn(),
    environment: getSentryEnvironment(),
    sendDefaultPii: false,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    includeLocalVariables: true,
    enableLogs: true,
  });
}
