import { describe, expect, it } from "vitest";
import {
  PRISMA_POOL_CONNECTION_TIMEOUT_MS,
  PRISMA_POOL_IDLE_TIMEOUT_MS,
  PRISMA_POOL_MAX,
} from "./client";

describe("Prisma pool defaults (ADR-019 Q-3)", () => {
  it("uses serverless-friendly pool limits", () => {
    expect(PRISMA_POOL_MAX).toBe(4);
    expect(PRISMA_POOL_IDLE_TIMEOUT_MS).toBe(10_000);
    expect(PRISMA_POOL_CONNECTION_TIMEOUT_MS).toBe(5_000);
  });
});
