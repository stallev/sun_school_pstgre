import { describe, expect, it } from "vitest";
import { assignLessonOrdinals, compareLessonsForOrdinal } from "./ordinal";

describe("compareLessonsForOrdinal", () => {
  it("orders by lesson date then created_at", () => {
    expect(
      compareLessonsForOrdinal(
        { lessonDate: "2026-09-01", createdAt: "2026-08-01T10:00:00.000Z" },
        { lessonDate: "2026-09-02", createdAt: "2026-08-01T09:00:00.000Z" },
      ),
    ).toBeLessThan(0);

    expect(
      compareLessonsForOrdinal(
        { lessonDate: "2026-09-01", createdAt: "2026-08-01T10:00:00.000Z" },
        { lessonDate: "2026-09-01", createdAt: "2026-08-01T11:00:00.000Z" },
      ),
    ).toBeLessThan(0);
  });
});

describe("assignLessonOrdinals", () => {
  it("assigns contiguous ordinals without gaps for same-day lessons", () => {
    const lessons = assignLessonOrdinals([
      { id: "b", lessonDate: "2026-09-01", createdAt: "2026-08-01T12:00:00.000Z" },
      { id: "a", lessonDate: "2026-09-01", createdAt: "2026-08-01T10:00:00.000Z" },
      { id: "c", lessonDate: "2026-09-02", createdAt: "2026-08-01T09:00:00.000Z" },
    ]);

    expect(lessons.find((lesson) => lesson.id === "a")?.ordinal).toBe(1);
    expect(lessons.find((lesson) => lesson.id === "b")?.ordinal).toBe(2);
    expect(lessons.find((lesson) => lesson.id === "c")?.ordinal).toBe(3);
  });
});
