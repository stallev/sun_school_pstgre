import { describe, expect, it, vi } from "vitest";
import { recalculateLessonOrdinals } from "./lesson-shared.server";

describe("recalculateLessonOrdinals", () => {
  it("assigns ordinals by date then created_at for same-day lessons", async () => {
    const executeRaw = vi.fn().mockResolvedValue(0);
    const tx = {
      lesson: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "b",
            lessonDate: new Date("2026-09-01T00:00:00.000Z"),
            createdAt: new Date("2026-08-01T12:00:00.000Z"),
            ordinal: 2,
          },
          {
            id: "a",
            lessonDate: new Date("2026-09-01T00:00:00.000Z"),
            createdAt: new Date("2026-08-01T10:00:00.000Z"),
            ordinal: 1,
          },
        ]),
      },
      $executeRaw: executeRaw,
    };

    await recalculateLessonOrdinals(tx as never, "grade", "year");

    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("batch-updates only lessons whose ordinal changed", async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);
    const tx = {
      lesson: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "b",
            lessonDate: new Date("2026-09-01T00:00:00.000Z"),
            createdAt: new Date("2026-08-01T12:00:00.000Z"),
            ordinal: 1,
          },
          {
            id: "a",
            lessonDate: new Date("2026-09-01T00:00:00.000Z"),
            createdAt: new Date("2026-08-01T10:00:00.000Z"),
            ordinal: 2,
          },
        ]),
      },
      $executeRaw: executeRaw,
    };

    await recalculateLessonOrdinals(tx as never, "grade", "year");

    expect(executeRaw).toHaveBeenCalledTimes(1);
  });
});
