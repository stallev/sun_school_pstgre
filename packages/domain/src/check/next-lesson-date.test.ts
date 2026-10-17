import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import { nextLessonDate } from "./next-lesson-date";

const lessons = [
  {
    id: "lesson-1",
    lessonDate: "2026-09-01",
    createdAt: "2026-08-01T10:00:00.000Z",
    kind: LESSON_KIND.REGULAR,
  },
  {
    id: "review",
    lessonDate: "2026-09-08",
    createdAt: "2026-08-01T11:00:00.000Z",
    kind: LESSON_KIND.REVIEW,
  },
  {
    id: "lesson-2",
    lessonDate: "2026-09-15",
    createdAt: "2026-08-01T12:00:00.000Z",
    kind: LESSON_KIND.REGULAR,
  },
];

describe("nextLessonDate", () => {
  it("returns the next lesson date in ordinal order", () => {
    expect(nextLessonDate(lessons, "lesson-1")).toBe("2026-09-08");
    expect(nextLessonDate(lessons, "review")).toBe("2026-09-15");
  });

  it("returns null when there is no following lesson", () => {
    expect(nextLessonDate(lessons, "lesson-2")).toBeNull();
  });
});
