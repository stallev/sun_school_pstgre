import * as Sentry from "@sentry/nextjs";
import { buildServerSentryOptions } from "@/lib/sentry/init-options";

const serverOptions = buildServerSentryOptions();
if (serverOptions) {
  Sentry.init(serverOptions);
}
