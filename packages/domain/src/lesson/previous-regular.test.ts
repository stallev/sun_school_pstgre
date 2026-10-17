import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import { previousRegularLesson } from "./previous-regular";

describe("previousRegularLesson", () => {
  it("skips review lessons (БП-2)", () => {
    const lessons = [
      {
        id: "regular-1",
        kind: LESSON_KIND.REGULAR,
        lessonDate: "2026-09-01",
        createdAt: "2026-08-01T10:00:00.000Z",
      },
      {
        id: "review",
        kind: LESSON_KIND.REVIEW,
        lessonDate: "2026-09-08",
        createdAt: "2026-08-01T11:00:00.000Z",
      },
      {
        id: "regular-2",
        kind: LESSON_KIND.REGULAR,
        lessonDate: "2026-09-15",
        createdAt: "2026-08-01T12:00:00.000Z",
      },
    ];

    expect(previousRegularLesson(lessons, "regular-2")).toEqual(lessons[0]);
    expect(previousRegularLesson(lessons, "review")).toEqual(lessons[0]);
    expect(previousRegularLesson(lessons, "regular-1")).toBeNull();
  });
});
