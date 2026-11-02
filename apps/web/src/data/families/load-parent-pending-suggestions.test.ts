import { describe, expect, it, vi } from "vitest";
import { ACHIEVEMENT_SUGGESTION_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";

vi.mock("server-only", () => ({}));
const loadSuggestionVerses = vi.fn();
vi.mock("@/data/achievements/load-suggestion-verses.server", () => ({
  loadSuggestionVerses: (...args: unknown[]) => loadSuggestionVerses(...args),
}));

import { loadParentPendingSuggestions } from "./load-parent-pending-suggestions.server";

const pupilId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const academicYearId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function dbWith(rows: unknown[]) {
  const findMany = vi.fn().mockResolvedValue(rows);
  return { db: { achievementSuggestion: { findMany } } as unknown as PrismaClient, findMany };
}

const baseArgs = {
  pupilId,
  academicYearId,
  achievementsEnabled: true,
  locale: "ru" as const,
  timeZone: "Europe/Moscow",
};

describe("loadParentPendingSuggestions", () => {
  it("returns nothing and does not query when features.achievements is off", async () => {
    const { db, findMany } = dbWith([]);
    const result = await loadParentPendingSuggestions(db, { ...baseArgs, achievementsEnabled: false });
    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("queries only SUGGESTED rows of this pupil in the given (active) year", async () => {
    const { db, findMany } = dbWith([]);
    expect(await loadParentPendingSuggestions(db, baseArgs)).toEqual([]);
    expect(findMany.mock.calls[0]![0].where).toEqual({
      pupilId,
      academicYearId,
      status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED,
    });
    expect(loadSuggestionVerses).not.toHaveBeenCalled();
  });

  it("maps name by locale and exposes no points or action fields", async () => {
    loadSuggestionVerses.mockResolvedValue([[{ reference: "Ин 3:16", text: "t", dateLabel: "1 ноября" }]]);
    const { db } = dbWith([
      {
        id: "s1",
        tier: 2,
        evidenceCheckIds: ["c1", "c2"],
        achievement: { nameRu: "Стихи", nameEn: "Verses" },
        grade: { language: "ru" },
      },
    ]);
    const ru = await loadParentPendingSuggestions(db, baseArgs);
    expect(ru).toEqual([
      {
        suggestionId: "s1",
        achievementName: "Стихи",
        tier: 2,
        verses: [{ reference: "Ин 3:16", text: "t", dateLabel: "1 ноября" }],
      },
    ]);
    loadSuggestionVerses.mockResolvedValue([[]]);
    const en = await loadParentPendingSuggestions(db, { ...baseArgs, locale: "en" });
    expect(en[0]!.achievementName).toBe("Verses");
  });
});
