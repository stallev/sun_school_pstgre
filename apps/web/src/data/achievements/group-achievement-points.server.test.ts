import { describe, expect, it } from "vitest";
import {
  globalCatalogPenaltyPoints,
  resolvePenaltyCatalogPoints,
  resolveRewardTierPoints,
} from "./group-achievement-points.server";

describe("group achievement points helpers", () => {
  it("resolveRewardTierPoints uses override when present", () => {
    const overrides = new Map([["ach-1:2", 15]]);
    const result = resolveRewardTierPoints(10, overrides, "ach-1", 2);
    expect(result).toEqual({ points: 15, pointsSource: "grade" });
  });

  it("resolveRewardTierPoints falls back to global", () => {
    const result = resolveRewardTierPoints(10, new Map(), "ach-1", 2);
    expect(result).toEqual({ points: 10, pointsSource: "global" });
  });

  it("resolvePenaltyCatalogPoints uses tier 0 override", () => {
    const overrides = new Map([["pen-1:0", -7]]);
    const result = resolvePenaltyCatalogPoints(-5, -5, overrides, "pen-1");
    expect(result).toEqual({ points: -7, pointsSource: "grade" });
  });

  it("globalCatalogPenaltyPoints prefers tier row", () => {
    expect(globalCatalogPenaltyPoints(-3, -4)).toBe(-4);
    expect(globalCatalogPenaltyPoints(-3, undefined)).toBe(-3);
  });
});
