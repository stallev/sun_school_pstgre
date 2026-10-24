import { describe, expect, it } from "vitest";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import {
  buildDraftsFromRows,
  collectGroupPointsSaveItems,
} from "@/lib/achievements/group-points-drafts";

const baseRow = (overrides: Partial<GroupPointsTableRowDto> = {}): GroupPointsTableRowDto => ({
  rowKey: "ach-1:1",
  achievementId: "ach-1",
  tier: 1,
  achievementName: "Test",
  tierLabel: "I",
  conditionLabel: "5",
  globalPoints: 10,
  overridePoints: null,
  isPenalty: false,
  readOnly: false,
  ...overrides,
});

describe("group-points-drafts after server copy", () => {
  it("does not clear overrides when stale empty drafts are synced from copied rows", () => {
    const copiedRow = baseRow({ overridePoints: 7 });
    const staleDrafts = { "ach-1:1": "" };

    const staleSave = collectGroupPointsSaveItems([copiedRow], staleDrafts, "err");
    expect(staleSave.items).toEqual([
      { achievementId: "ach-1", tier: 1, points: null },
    ]);

    const syncedDrafts = buildDraftsFromRows([copiedRow]);
    const saveAfterSync = collectGroupPointsSaveItems([copiedRow], syncedDrafts, "err");
    expect(saveAfterSync.items).toEqual([]);
  });
});
