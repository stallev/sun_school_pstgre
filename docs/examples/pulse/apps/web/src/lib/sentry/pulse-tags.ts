import * as Sentry from "@sentry/nextjs";

import { isSentryEnabled } from "@/lib/sentry/config";

export const SUBMIT_TRANSPORT_TAGS = {
  SERVER_ACTION: "server-action",
  ROUTE_HANDLER_FALLBACK: "route-handler-fallback",
  ROUTE_HANDLER_PRIMARY: "route-handler-primary",
} as const;

export type SubmitTransportTag =
  (typeof SUBMIT_TRANSPORT_TAGS)[keyof typeof SUBMIT_TRANSPORT_TAGS];

export function setSubmitTransportTag(transport: SubmitTransportTag): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setTag("submit_transport", transport);
}
