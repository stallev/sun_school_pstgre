import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createPrismaClient = vi.fn();
const assertDbEnvironment = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@sunschool/db", () => ({
  createPrismaClient,
  assertDbEnvironment,
}));
vi.mock("@/lib/env.server", () => ({
  getServerEnv: () => ({
    DATABASE_URL: "postgresql://u:p@ep-test-pooler.us-east-2.aws.neon.tech/db",
    APP_ENV: "dev",
  }),
}));

describe("isRetryablePrismaConnectionError", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("matches pg-pool connect timeout message", async () => {
    const { isRetryablePrismaConnectionError } = await import("./db.server");
    expect(
      isRetryablePrismaConnectionError(new Error("timeout exceeded when trying to connect")),
    ).toBe(true);
  });

  it("matches ECONNRESET", async () => {
    const { isRetryablePrismaConnectionError } = await import("./db.server");
    const error = new Error("read ECONNRESET") as NodeJS.ErrnoException;
    error.code = "ECONNRESET";
    expect(isRetryablePrismaConnectionError(error)).toBe(true);
  });

  it("ignores unrelated errors", async () => {
    const { isRetryablePrismaConnectionError } = await import("./db.server");
    expect(isRetryablePrismaConnectionError(new Error("P2002"))).toBe(false);
  });
});

describe("getPrisma", () => {
  const timeoutError = new Error("timeout exceeded when trying to connect");
  const fakeClient = { kind: "prisma" };

  beforeEach(() => {
    vi.resetModules();
    createPrismaClient.mockReset();
    assertDbEnvironment.mockReset();
    createPrismaClient.mockReturnValue(fakeClient);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("parallel getPrisma calls share one client pool and one retry", async () => {
    let assertCalls = 0;
    assertDbEnvironment.mockImplementation(() => {
      assertCalls += 1;
      if (assertCalls === 1) {
        return Promise.reject(timeoutError);
      }
      return Promise.resolve(undefined);
    });

    const { getPrisma } = await import("./db.server");
    const results = await Promise.all([getPrisma(), getPrisma(), getPrisma()]);
    expect(results).toEqual([fakeClient, fakeClient, fakeClient]);
    expect(createPrismaClient).toHaveBeenCalledTimes(2);
    expect(assertDbEnvironment).toHaveBeenCalledTimes(2);
  });

  it("throws without a second retry after the process retry is consumed", async () => {
    assertDbEnvironment.mockRejectedValue(timeoutError);

    const { getPrisma } = await import("./db.server");
    await expect(getPrisma()).rejects.toThrow(timeoutError.message);
    await expect(getPrisma()).rejects.toThrow(timeoutError.message);
    expect(createPrismaClient).toHaveBeenCalledTimes(2);
    expect(assertDbEnvironment).toHaveBeenCalledTimes(2);
  });
});
