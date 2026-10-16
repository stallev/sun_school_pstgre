import * as Sentry from "@sentry/nextjs";
import { buildClientSentryOptions } from "@/lib/sentry/init-options";

const clientOptions = buildClientSentryOptions();
if (clientOptions) {
  Sentry.init(clientOptions);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
