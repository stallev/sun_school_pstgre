import { describe, expect, it } from "vitest";
import {
  computeGroupYearTotals,
  computePupilYearTotals,
  computeYearTotals,
} from "./year-totals";

describe("computeGroupYearTotals", () => {
  it("aggregates layer-A pupil metrics like P05 KPI", () => {
    const totals = computeGroupYearTotals({
      checkedLessonCount: 6,
      layerAPupils: [
        {
          attendanceRate: 0.8,
          versesAverage: 2,
          testAverage: 8,
          notebookAverage: 7,
        },
        {
          attendanceRate: 0.6,
          versesAverage: 1,
          testAverage: 6,
          notebookAverage: 9,
        },
      ],
    });

    expect(totals).toEqual({
      kids: 2,
      lessons: 6,
      attendance: 0.7,
      verses: 1.5,
      test: 7,
      notebook: 8,
    });
  });

  it("returns NULL metrics when there are no layer-A pupils", () => {
    expect(
      computeGroupYearTotals({
        checkedLessonCount: 0,
        layerAPupils: [],
      }),
    ).toEqual({
      kids: 0,
      lessons: 0,
      attendance: null,
      verses: null,
      test: null,
      notebook: null,
    });
  });
});

describe("computePupilYearTotals", () => {
  it("returns NULL metrics when lessons are zero", () => {
    expect(
      computePupilYearTotals({
        checkedLessonCount: 0,
        attendanceRate: 0.5,
        versesAverage: 1,
        testAverage: 5,
        notebookAverage: 6,
        bricksEarned: 3,
      }),
    ).toEqual({
      lessons: 0,
      attendance: null,
      verses: null,
      test: null,
      notebook: null,
      bricksEarned: 3,
    });
  });
});

describe("computeYearTotals", () => {
  it("dispatches by scope", () => {
    const group = computeYearTotals({
      scope: "group",
      data: { checkedLessonCount: 1, layerAPupils: [] },
    });
    expect(group).toMatchObject({ kids: 0, lessons: 1 });
  });
});
