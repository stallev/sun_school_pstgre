import { describe, expect, it, vi } from "vitest";
import { PENALTY_STATUS } from "@sunschool/domain";
import type { DbReader } from "@sunschool/db";
import {
  loadBricksBalanceComponents,
  loadBricksBalanceComponentsForPupils,
} from "./bricks-shared.server";

vi.mock("server-only", () => ({}));

type Fixture = {
  checkPoints: Record<string, number>;
  issued: Record<string, number>;
  bonus: Record<string, number>;
  penalties: { pupilId: string; points: number }[];
};

function buildMockDb(fixture: Fixture): DbReader {
  const pupilIdsFromIn = (pupilIdIn: { in: string[] } | string) =>
    typeof pupilIdIn === "string" ? [pupilIdIn] : pupilIdIn.in;

  return {
    homeworkCheck: {
      groupBy: async ({ where }: { where: { pupilId: { in: string[] } | string } }) =>
        pupilIdsFromIn(where.pupilId)
          .filter((id) => fixture.checkPoints[id] != null)
          .map((pupilId) => ({
            pupilId,
            _sum: { pointsTotal: fixture.checkPoints[pupilId] },
          })),
    },
    brickLedger: {
      groupBy: async ({ where }: { where: { pupilId: { in: string[] } | string } }) =>
        pupilIdsFromIn(where.pupilId)
          .filter((id) => fixture.issued[id] != null)
          .map((pupilId) => ({
            pupilId,
            _sum: { quantity: fixture.issued[pupilId] },
          })),
    },
    achievementAward: {
      groupBy: async ({ where }: { where: { pupilId: { in: string[] } | string } }) =>
        pupilIdsFromIn(where.pupilId)
          .filter((id) => fixture.bonus[id] != null)
          .map((pupilId) => ({
            pupilId,
            _sum: { points: fixture.bonus[pupilId] },
          })),
    },
    penalty: {
      findMany: async ({
        where,
      }: {
        where: { pupilId: { in: string[] }; status: string };
      }) => {
        if (where.status !== PENALTY_STATUS.ACTIVE) return [];
        return fixture.penalties.filter((row) => where.pupilId.in.includes(row.pupilId));
      },
    },
  } as unknown as DbReader;
}

describe("loadBricksBalanceComponentsForPupils", () => {
  const yearId = "year-1";
  const fixture: Fixture = {
    checkPoints: { p1: 10, p2: 5 },
    issued: { p1: 3, p2: 1 },
    bonus: { p1: 2 },
    penalties: [
      { pupilId: "p1", points: -4 },
      { pupilId: "p2", points: 2 },
    ],
  };

  it("matches per-pupil loadBricksBalanceComponents including empty pupil", async () => {
    const db = buildMockDb(fixture);
    const pupilIds = ["p1", "p2", "p-empty"];
    const batch = await loadBricksBalanceComponentsForPupils(db, pupilIds, yearId);

    for (const pupilId of pupilIds) {
      const single = await loadBricksBalanceComponents(db, pupilId, yearId);
      expect(batch.get(pupilId)).toEqual(single);
    }

    expect(batch.get("p-empty")).toEqual({
      checkPoints: 0,
      achievementBonus: 0,
      penaltiesTotal: 0,
      issued: 0,
    });
    expect(batch.get("p1")).toEqual({
      checkPoints: 10,
      achievementBonus: 2,
      penaltiesTotal: 4,
      issued: 3,
    });
  });
});
