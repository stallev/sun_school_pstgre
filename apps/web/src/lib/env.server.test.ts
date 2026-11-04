import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("assertPooledDatabaseUrl", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    warnSpy.mockClear();
    delete process.env.ALLOW_DIRECT_DATABASE_URL;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("allows pooled Neon hostnames", async () => {
    const { assertPooledDatabaseUrl } = await import("./env.server");
    expect(() =>
      assertPooledDatabaseUrl("prod", "postgresql://u:p@ep-foo-pooler.us-east-2.aws.neon.tech/neondb"),
    ).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns in dev when hostname lacks -pooler", async () => {
    const { assertPooledDatabaseUrl } = await import("./env.server");
    assertPooledDatabaseUrl("dev", "postgresql://u:p@ep-foo.us-east-2.aws.neon.tech/neondb");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(String(warnSpy.mock.calls[0]?.[0])).not.toContain("postgresql://");
  });

  it("throws in prod when hostname lacks -pooler", async () => {
    const { assertPooledDatabaseUrl } = await import("./env.server");
    expect(() =>
      assertPooledDatabaseUrl("prod", "postgresql://u:p@ep-foo.us-east-2.aws.neon.tech/neondb"),
    ).toThrow(/-pooler/);
  });

  it("skips check when ALLOW_DIRECT_DATABASE_URL=1", async () => {
    process.env.ALLOW_DIRECT_DATABASE_URL = "1";
    const { assertPooledDatabaseUrl } = await import("./env.server");
    assertPooledDatabaseUrl("prod", "postgresql://u:p@localhost/neondb");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
