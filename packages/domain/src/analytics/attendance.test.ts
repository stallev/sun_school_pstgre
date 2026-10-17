import { describe, expect, it } from "vitest";
import { ATTENDANCE_SAMPLE_THRESHOLD, computeAttendanceCounts } from "./attendance";

describe("computeAttendanceCounts", () => {
  it.each([
    {
      name: "50% threshold boundary",
      rows: [
        {
          lessonDate: "2026-09-01",
          isCheckedLesson: true,
          hasPupilRecord: true,
          present: true,
          onOrAfterCountingStart: true,
        },
        {
          lessonDate: "2026-09-08",
          isCheckedLesson: true,
          hasPupilRecord: true,
          present: false,
          onOrAfterCountingStart: true,
        },
      ],
      expectedRate: 0.5,
    },
    {
      name: "no checked lessons with record",
      rows: [
        {
          lessonDate: "2026-09-01",
          isCheckedLesson: true,
          hasPupilRecord: false,
          present: false,
          onOrAfterCountingStart: true,
        },
      ],
      expectedRate: null,
    },
    {
      name: "before counting start excluded",
      rows: [
        {
          lessonDate: "2026-08-01",
          isCheckedLesson: true,
          hasPupilRecord: true,
          present: false,
          onOrAfterCountingStart: false,
        },
        {
          lessonDate: "2026-09-01",
          isCheckedLesson: true,
          hasPupilRecord: true,
          present: true,
          onOrAfterCountingStart: true,
        },
      ],
      expectedRate: 1,
    },
  ])("$name", ({ rows, expectedRate }) => {
    const result = computeAttendanceCounts(rows);
    expect(result.rate).toBe(expectedRate);
  });

  it("documents sample threshold at 50%", () => {
    expect(ATTENDANCE_SAMPLE_THRESHOLD).toBe(0.5);
  });
});
