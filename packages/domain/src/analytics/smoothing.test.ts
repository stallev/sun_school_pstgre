import { describe, expect, it } from "vitest";
import { movingAverage, successiveDifferences } from "./smoothing";

describe("movingAverage", () => {
  it("smooths over three lessons with available points", () => {
    expect(movingAverage([60, 80, 40])).toEqual([60, 70, 60]);
  });

  it("computes lesson-to-lesson deltas on smoothed values", () => {
    const smoothed = movingAverage([50, 80, 70, 90]);
    const deltas = successiveDifferences(smoothed);
    expect(deltas[0]).toBe(15);
    expect(deltas[1]).toBeCloseTo(5 / 3);
    expect(deltas[2]).toBeCloseTo(40 / 3);
  });
});
