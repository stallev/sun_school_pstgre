import { describe, expect, it } from "vitest";
import { computeRatingMetric, rankRatingRows } from "./rating";

describe("computeRatingMetric", () => {
  it("sums checked lesson points (Q-01)", () => {
    expect(computeRatingMetric([12, 8, 0])).toBe(20);
  });
});

describe("rankRatingRows", () => {
  it("orders by metric descending", () => {
    const ranked = rankRatingRows([
      { pupilId: "b", metric: 10 },
      { pupilId: "a", metric: 20 },
      { pupilId: "c", metric: 10 },
    ]);
    expect(ranked.map((row) => row.pupilId)).toEqual(["a", "b", "c"]);
  });
});
