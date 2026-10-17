import { describe, expect, it } from "vitest";
import {
  classifySampleLayer,
  resolveSampleCountingStartDate,
  SAMPLE_LAYER,
} from "./sample-layers";

describe("resolveSampleCountingStartDate", () => {
  it.each([
    {
      enrollment: "2026-09-10",
      earliest: "2026-09-01",
      expected: "2026-09-01",
    },
    {
      enrollment: "2026-09-01",
      earliest: null,
      expected: "2026-09-01",
    },
    {
      enrollment: null,
      earliest: "2026-09-05",
      expected: "2026-09-05",
    },
    {
      enrollment: null,
      earliest: null,
      expected: null,
    },
  ])("picks earlier start ($expected)", ({ enrollment, earliest, expected }) => {
    expect(resolveSampleCountingStartDate(enrollment, earliest)).toBe(expected);
  });
});

describe("classifySampleLayer", () => {
  const baseAttendance = {
    presentCount: 5,
    checkedWithRecordCount: 10,
    rate: 0.5,
  };

  it.each([
    {
      name: "layer A at threshold",
      input: {
        pupilIsActive: true,
        countingStartDate: "2026-09-01",
        attendance: baseAttendance,
        hasCheckedLessonAfterCountingStart: true,
      },
      layer: SAMPLE_LAYER.A,
    },
    {
      name: "layer B below threshold",
      input: {
        pupilIsActive: true,
        countingStartDate: "2026-09-01",
        attendance: { ...baseAttendance, rate: 0.49 },
        hasCheckedLessonAfterCountingStart: true,
      },
      layer: SAMPLE_LAYER.B,
    },
    {
      name: "layer C inactive",
      input: {
        pupilIsActive: false,
        countingStartDate: "2026-09-01",
        attendance: baseAttendance,
        hasCheckedLessonAfterCountingStart: true,
      },
      layer: SAMPLE_LAYER.C,
    },
    {
      name: "layer D no enrollment",
      input: {
        pupilIsActive: true,
        countingStartDate: null,
        attendance: { presentCount: 0, checkedWithRecordCount: 0, rate: null },
        hasCheckedLessonAfterCountingStart: false,
      },
      layer: SAMPLE_LAYER.D,
    },
    {
      name: "layer D no checked lessons",
      input: {
        pupilIsActive: true,
        countingStartDate: "2026-09-01",
        attendance: { presentCount: 0, checkedWithRecordCount: 0, rate: null },
        hasCheckedLessonAfterCountingStart: false,
      },
      layer: SAMPLE_LAYER.D,
    },
  ])("$name", ({ input, layer }) => {
    expect(classifySampleLayer(input)).toBe(layer);
  });
});
