import { describe, expect, it } from "vitest";
import { buildBricksBalanceSnapshot, computeBalance } from "./compute-balance";

describe("buildBricksBalanceSnapshot (bricks_ledger §3)", () => {
  it("includes bonus and penalties when achievements flag is on", () => {
    expect(
      buildBricksBalanceSnapshot(
        { checkPoints: 50, achievementBonus: 20, penaltiesTotal: 5, issued: 10 },
        true,
      ),
    ).toEqual({
      earned: 65,
      issued: 10,
      balance: 55,
      needsAttention: false,
      checkPoints: 50,
      achievementBonus: 20,
      penaltiesTotal: 5,
    });
  });

  it("zeros bonus and penalties when achievements flag is off", () => {
    expect(
      buildBricksBalanceSnapshot(
        { checkPoints: 50, achievementBonus: 20, penaltiesTotal: 5, issued: 10 },
        false,
      ),
    ).toEqual({
      earned: 50,
      issued: 10,
      balance: 40,
      needsAttention: false,
      checkPoints: 50,
      achievementBonus: 0,
      penaltiesTotal: 0,
    });
  });

  it("allows negative balance after revoke (bonus drop)", () => {
    const snapshot = buildBricksBalanceSnapshot(
      { checkPoints: 10, achievementBonus: 0, penaltiesTotal: 0, issued: 15 },
      true,
    );
    expect(snapshot.balance).toBe(-5);
    expect(snapshot.needsAttention).toBe(true);
  });
});

describe("computeBalance (bricks_ledger §3)", () => {
  it("returns balance as earned minus issued", () => {
    expect(computeBalance(100, 30)).toEqual({
      earned: 100,
      issued: 30,
      balance: 70,
      needsAttention: false,
      checkPoints: 100,
      achievementBonus: 0,
      penaltiesTotal: 0,
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
