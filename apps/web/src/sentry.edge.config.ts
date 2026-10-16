import * as Sentry from "@sentry/nextjs";
import { buildEdgeSentryOptions } from "@/lib/sentry/init-options";

const edgeOptions = buildEdgeSentryOptions();
if (edgeOptions) {
  Sentry.init(edgeOptions);
}
