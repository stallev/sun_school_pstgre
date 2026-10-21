import { afterEach, describe, expect, it, vi } from "vitest";
import { buildContentSecurityPolicy, createCspNonce, getBaselineSecurityHeaderEntries } from "./request-security";

describe("request-security", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("createCspNonce returns non-empty base64", () => {
    expect(createCspNonce().length).toBeGreaterThan(8);
  });

  it("style-src allows unsafe-inline and does not pair it with a nonce", () => {
    const csp = buildContentSecurityPolicy("abc");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("style-src 'self' 'nonce-");
  });

  it("prod CSP includes upgrade-insecure-requests", () => {
    vi.stubEnv("APP_ENV", "prod");
    vi.stubEnv("NODE_ENV", "production");
    const csp = buildContentSecurityPolicy("abc");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("dev CSP allows unsafe-eval for Next dev tooling", () => {
    vi.stubEnv("APP_ENV", "dev");
    vi.stubEnv("NODE_ENV", "development");
    const csp = buildContentSecurityPolicy("abc");
    expect(csp).toContain("unsafe-eval");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("baseline headers include HSTS only outside dev runtime", () => {
    vi.stubEnv("APP_ENV", "prod");
    vi.stubEnv("NODE_ENV", "production");
    const prodKeys = getBaselineSecurityHeaderEntries().map((entry) => entry.key);
    expect(prodKeys).toContain("Strict-Transport-Security");

    vi.stubEnv("APP_ENV", "dev");
    vi.stubEnv("NODE_ENV", "development");
    const devKeys = getBaselineSecurityHeaderEntries().map((entry) => entry.key);
    expect(devKeys).not.toContain("Strict-Transport-Security");
  });
});
