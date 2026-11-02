import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@sunschool/db";

vi.mock("server-only", () => ({}));
vi.mock("@/data/bible/get-group-translation", () => ({
  resolveGroupTranslation: async () => ({ ok: true, translationId: "t", code: "SYNO", locale: "RU" }),
}));
vi.mock("@/data/bible/get-verse-text", () => ({
  buildVerseTextForRange: async () => ({ ok: true, text: "Текст стиха" }),
}));
vi.mock("@/data/bible/list-books", () => ({
  listBooks: async () => [{ id: "b1", shortRu: "Ин", shortEn: "Jn" }],
}));

import { loadPupilSuggestions } from "./load-pupil-suggestions.server";

const range = { bookId: "b1", startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 16 };

const makeDb = () => {
  const findMany = vi.fn(async () => [
    {
      id: "s1",
      tier: 1,
      deferredAt: null,
      evidenceCheckIds: ["c1", "c2"],
      achievement: { nameRu: "Хранитель", nameEn: "Keeper" },
      grade: { language: "RU" },
    },
  ]);
  const db = {
    achievementSuggestion: { findMany },
    homeworkCheck: {
      findMany: async () => [
        { id: "c1", lesson: { lessonDate: new Date("2026-10-05"), verses: [{ goldenVerse: range }] } },
        { id: "c2", lesson: { lessonDate: new Date("2026-10-12"), verses: [{ goldenVerse: range }] } },
      ],
    },
  };
  return { db: db as unknown as PrismaClient, findMany };
};

const base = {
  actorUserId: "u1",
  pupilId: "p1",
  academicYearId: "y1",
  locale: "ru" as const,
  timeZone: "Europe/Moscow",
};

describe("loadPupilSuggestions", () => {
  it("restricts a teacher to groups they are assigned to in the year", async () => {
    const { db, findMany } = makeDb();
    await loadPupilSuggestions(db, { ...base, isAdmin: false, canAct: true });
    const where = (findMany.mock.calls[0] as unknown as [{ where: Record<string, unknown> }])[0].where;
    expect(where.grade).toEqual({ assignments: { some: { userId: "u1", academicYearId: "y1" } } });
  });

  it("does not restrict groups for an admin", async () => {
    const { db, findMany } = makeDb();
    await loadPupilSuggestions(db, { ...base, isAdmin: true, canAct: true });
    const where = (findMany.mock.calls[0] as unknown as [{ where: Record<string, unknown> }])[0].where;
    expect(where.grade).toBeUndefined();
  });

  it("maps verses (deduped, group translation) and passes canAct=false for a closed year", async () => {
    const { db } = makeDb();
    const rows = await loadPupilSuggestions(db, { ...base, isAdmin: false, canAct: false });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ suggestionId: "s1", seriesLength: 2, canAct: false });
    expect(rows[0]?.verses).toEqual([
      { reference: "Ин 3:16", text: "Текст стиха", dateLabel: expect.any(String) },
    ]);
  });
});
