import { describe, expect, it, vi } from "vitest";
import { recalculateLessonOrdinals } from "./lesson-shared.server";

describe("recalculateLessonOrdinals", () => {
  it("assigns ordinals by date then created_at for same-day lessons", async () => {
    const updates: { id: string; ordinal: number }[] = [];
    const tx = {
      lesson: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "b",
            lessonDate: new Date("2026-09-01T00:00:00.000Z"),
            createdAt: new Date("2026-08-01T12:00:00.000Z"),
          },
          {
            id: "a",
            lessonDate: new Date("2026-09-01T00:00:00.000Z"),
            createdAt: new Date("2026-08-01T10:00:00.000Z"),
          },
        ]),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: { ordinal: number } }) => {
          updates.push({ id: where.id, ordinal: data.ordinal });
        }),
      },
    };

    await recalculateLessonOrdinals(tx as never, "grade", "year");

    expect(updates).toEqual([
      { id: "a", ordinal: 1 },
      { id: "b", ordinal: 2 },
    ]);
  });
});
