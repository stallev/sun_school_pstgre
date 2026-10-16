import type { ErrorEvent, Event, EventHint, Exception } from "@sentry/core";
import { REDACTED_PLACEHOLDER } from "@/lib/sentry/config";

const SENSITIVE_KEY_SUBSTRINGS = [
  "password",
  "passwd",
  "email",
  "phone",
  "username",
  "token",
  "authorization",
  "cookie",
  "secret",
  "firstname",
  "first_name",
  "lastname",
  "last_name",
  "given_name",
  "family_name",
  "middle_name",
  "display_name",
  "full_name",
] as const;

const EXACT_SENSITIVE_KEYS = new Set([
  "form",
  "formdata",
  "form_data",
  "formbody",
  "form_body",
  "fields",
]);

const PRESERVED_KEYS = new Set(["digest", "code"]);

const EMAIL_IN_STRING =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BEARER_IN_STRING = /bearer\s+[a-zA-Z0-9._~+/=-]+/gi;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (PRESERVED_KEYS.has(normalized)) return false;
  if (EXACT_SENSITIVE_KEYS.has(normalized)) return true;
  return SENSITIVE_KEY_SUBSTRINGS.some((part) => normalized.includes(part));
}

function scrubStringValue(value: string): string {
  let next = value.replace(EMAIL_IN_STRING, REDACTED_PLACEHOLDER);
  next = next.replace(BEARER_IN_STRING, REDACTED_PLACEHOLDER);
  return next;
}

function scrubUnknown(value: unknown, parentKey?: string): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    if (parentKey && isSensitiveKey(parentKey)) return REDACTED_PLACEHOLDER;
    return scrubStringValue(value);
  }

  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((entry) => scrubUnknown(entry, parentKey));
  }

  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (isSensitiveKey(key)) {
      out[key] = REDACTED_PLACEHOLDER;
      continue;
    }
    out[key] = scrubUnknown(entry, key);
  }
  return out;
}

function scrubExceptions(exceptions: Exception[] | undefined): Exception[] | undefined {
  if (!exceptions?.length) return exceptions;
  return exceptions.map((item) => ({
    ...item,
    value: typeof item.value === "string" ? scrubStringValue(item.value) : item.value,
  }));
}

/** Removes form fields, credentials and PII before Sentry ingest (INV-23). */
export function scrubSentryEvent(event: Event): Event {
  const scrubbed: Event = {
    ...event,
    message: typeof event.message === "string" ? scrubStringValue(event.message) : event.message,
    user: undefined,
    request: event.request
      ? (scrubUnknown(event.request, "request") as Event["request"])
      : event.request,
    contexts: event.contexts
      ? (scrubUnknown(event.contexts, "contexts") as Event["contexts"])
      : event.contexts,
    extra: event.extra
      ? (scrubUnknown(event.extra, "extra") as Event["extra"])
      : event.extra,
    breadcrumbs: event.breadcrumbs?.map((crumb) => ({
      ...crumb,
      data: crumb.data
        ? (scrubUnknown(crumb.data, "data") as Record<string, unknown>)
        : crumb.data,
      message:
        typeof crumb.message === "string" ? scrubStringValue(crumb.message) : crumb.message,
    })),
    exception: event.exception
      ? {
          ...event.exception,
          values: scrubExceptions(event.exception.values),
        }
      : event.exception,
  };

  return scrubbed;
}

export function sentryBeforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  return scrubSentryEvent(event) as ErrorEvent;
}
