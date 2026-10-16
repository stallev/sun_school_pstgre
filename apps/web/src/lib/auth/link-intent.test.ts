import { describe, expect, it } from "vitest";
import { LOGIN_PROVIDER } from "@sunschool/domain";
import { LINK_INTENT_TTL_MS, parseLinkIntentValue, signLinkIntentValue, type LinkIntentPayload } from "./link-intent";

const SECRET = "test-secret-at-least-16-chars";
const NOW = new Date("2026-10-16T12:00:00.000Z");

const samplePayload = (expOffsetMs = LINK_INTENT_TTL_MS): LinkIntentPayload => ({
  uid: "11111111-1111-1111-1111-111111111111",
  provider: LOGIN_PROVIDER.TELEGRAM,
  nonce: "abc123",
  exp: NOW.getTime() + expOffsetMs,
});

describe("link-intent cookie value", () => {
  it("round-trips a valid signed payload", () => {
    const value = signLinkIntentValue(samplePayload(), SECRET);
    expect(parseLinkIntentValue(value, SECRET, NOW)).toEqual(samplePayload());
  });

  it("rejects an expired payload", () => {
    const value = signLinkIntentValue(samplePayload(-1), SECRET);
    expect(parseLinkIntentValue(value, SECRET, NOW)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const value = signLinkIntentValue(samplePayload(), SECRET);
    const tampered = `${value}x`;
    expect(parseLinkIntentValue(tampered, SECRET, NOW)).toBeNull();
  });

  it("rejects a payload with the wrong provider when verified separately", () => {
    const value = signLinkIntentValue({ ...samplePayload(), provider: LOGIN_PROVIDER.CREDENTIALS }, SECRET);
    const parsed = parseLinkIntentValue(value, SECRET, NOW);
    expect(parsed?.provider).toBe(LOGIN_PROVIDER.CREDENTIALS);
  });
});
