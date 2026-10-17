import { describe, expect, it } from "vitest";
import { computeBalance } from "./compute-balance";

describe("computeBalance (bricks_ledger §3)", () => {
  it("returns balance as earned minus issued", () => {
    expect(computeBalance(100, 30)).toEqual({
      earned: 100,
      issued: 30,
      balance: 70,
      needsAttention: false,
    });
  });

  it("flags needsAttention when balance is negative", () => {
    expect(computeBalance(10, 15).needsAttention).toBe(true);
    expect(computeBalance(10, 15).balance).toBe(-5);
  });

  it("treats negative ledger entries as reducing issued total", () => {
    expect(computeBalance(20, 18).balance).toBe(2);
    expect(computeBalance(20, 25).balance).toBe(-5);
  });
});
