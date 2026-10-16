import { describe, expect, it } from "vitest";
import type { Event } from "@sentry/core";
import { REDACTED_PLACEHOLDER } from "@/lib/sentry/config";
import { scrubSentryEvent } from "./scrub";

describe("scrubSentryEvent", () => {
  it("redacts password, email, and token fields but keeps digest and auth error code", () => {
    const event: Event = {
      event_id: "test",
      timestamp: 1,
      platform: "node",
      contexts: {
        nextjs: { digest: "abc123digest" },
      },
      extra: {
        password: "hunter2",
        email: "teacher@example.test",
        access_token: "secret-token-value",
        code: "Configuration",
      },
      request: {
        headers: {
          authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.payload",
          cookie: "session=abc",
        },
        data: {
          form: { email: "admin@example.test", password: "x" },
        },
      },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.extra?.password).toBe(REDACTED_PLACEHOLDER);
    expect(scrubbed.extra?.email).toBe(REDACTED_PLACEHOLDER);
    expect(scrubbed.extra?.access_token).toBe(REDACTED_PLACEHOLDER);
    expect(scrubbed.extra?.code).toBe("Configuration");
    expect(scrubbed.contexts?.nextjs).toEqual({ digest: "abc123digest" });
    expect(scrubbed.request?.headers?.authorization).toBe(REDACTED_PLACEHOLDER);
    expect(scrubbed.request?.data).toEqual({
      form: REDACTED_PLACEHOLDER,
    });
  });

  it("scrubs email-like substrings inside generic messages", () => {
    const event: Event = {
      event_id: "test",
      timestamp: 1,
      platform: "javascript",
      message: "Failed for user teacher@example.test",
    };

    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.message).toBe(`Failed for user ${REDACTED_PLACEHOLDER}`);
  });
});
