import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACHIEVEMENT_FACT_STATE,
  ACHIEVEMENT_RULE_TYPE,
  AUDIT_ACTION,
  buildAchievementAwardKey,
  type AchievementEvaluateRule,
  type AchievementExistingAward,
} from "@sunschool/domain";
import { Prisma } from "@sunschool/db";
import { evaluatePupilInTransaction } from "./evaluate-pupil";

const mocks = vi.hoisted(() => ({
  flagOn: true,
  modeOn: true,
  context: null as unknown,
  writeAudit: vi.fn(),
}));

vi.mock("./achievement-feature.server", () => ({
  readFeaturesAchievementsEnabled: async () => mocks.flagOn,
}));
vi.mock("./achievement-mode.server", () => ({
  loadGradeAchievementMode: async () => (mocks.modeOn ? { achievementsEnabled: true } : null),
}));
vi.mock("../school/school-pupil-shared.server", () => ({ lockPupilRow: async () => true }));
vi.mock("./achievement-evaluate-context.server", () => ({
  loadAchievementEvaluateContext: async () => mocks.context,
}));
vi.mock("./group-achievement-points.server", () => ({
  loadGroupAchievementPointsOverridesForGrades: async () => new Map(),
  resolveRewardTierPoints: (global: number) => ({ points: global, pointsSource: "global" }),
}));
vi.mock("@sunschool/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sunschool/db")>()),
  writeAudit: (...args: unknown[]) => mocks.writeAudit(...args),
}));

const PUPIL = "pupil";
const YEAR = "year";
const VERSES = "ach-verses";
const FIRST = "ach-first";

function seriesRule(
  achievementId: string,
  metric: string,
  lengths: number[],
): AchievementEvaluateRule {
  return {
    achievementId,
    ruleType: ACHIEVEMENT_RULE_TYPE.SERIES,
    metric,
    isActive: true,
    tiers: lengths.map((length, index) => ({ tier: index + 1, length, points: 10 * (index + 1) })),
  };
}

function credited(ids: string[]) {
  return ids.map((factId) => ({ factId, state: ACHIEVEMENT_FACT_STATE.CREDITED }));
}

function existing(achievementId: string, evidenceFactIds: string[]): AchievementExistingAward {
  return { achievementId, tier: 1, academicYearId: YEAR, revokedAt: null, evidenceFactIds };
}

function setContext(input: { verseFacts: string[]; awards?: AchievementExistingAward[] }) {
  mocks.context = {
    rules: [seriesRule(VERSES, "verses", [3, 5]), seriesRule(FIRST, "first", [1])],
    awards: input.awards ?? [],
    factsByMetric: new Map([
      ["verses", credited(input.verseFacts)],
      ["first", credited(input.verseFacts.slice(0, 1))],
    ]),
    checkGradeByCheckId: new Map(
      input.verseFacts.map((id) => [id, id === "c5" ? "grade-b" : "grade-a"]),
    ),
  };
}

function p2002() {
  return new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "test" });
}

type CreateArg = { data: Record<string, unknown> };

function makeTx(opts: { suggestionError?: unknown; takenSuggestionKey?: boolean } = {}) {
  const suggestionCreate = vi.fn(async (_arg: CreateArg) => {
    if (opts.suggestionError) throw opts.suggestionError;
    return { id: `sug-${suggestionCreate.mock.calls.length}` };
  });
  const awardCreate = vi.fn(async (_arg: CreateArg) => ({
    id: `award-${awardCreate.mock.calls.length}`,
  }));
  const tx = {
    achievement: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
        code: where.id,
        ruleType: ACHIEVEMENT_RULE_TYPE.SERIES,
        metric: where.id === VERSES ? "verses" : "first",
        threshold: null,
        requiresConfirmation: where.id === VERSES,
        tiers:
          where.id === VERSES
            ? [
                { tier: 1, length: 3, points: 10 },
                { tier: 2, length: 5, points: 20 },
              ]
            : [{ tier: 1, length: 1, points: 10 }],
      })),
    },
    achievementSuggestion: {
      create: suggestionCreate,
      findUnique: vi.fn(async () => (opts.takenSuggestionKey ? { id: "sug-existing" } : null)),
    },
    achievementAward: { create: awardCreate },
  };
  return { tx, suggestionCreate, awardCreate };
}

function run(tx: unknown) {
  return evaluatePupilInTransaction(tx as never, "actor", PUPIL, YEAR, "grade-a");
}

beforeEach(() => {
  mocks.flagOn = true;
  mocks.modeOn = true;
  mocks.writeAudit.mockReset();
});

describe("evaluatePupilInTransaction", () => {
  it("returns no awards when the feature flag is off", async () => {
    mocks.flagOn = false;
    const { tx, suggestionCreate, awardCreate } = makeTx();
    expect(await run(tx)).toEqual({ awardIds: [], suggestionIds: [] });
    expect(suggestionCreate).not.toHaveBeenCalled();
    expect(awardCreate).not.toHaveBeenCalled();
  });

  it("does nothing when group achievement mode is off", async () => {
    mocks.modeOn = false;
    const { tx, suggestionCreate, awardCreate } = makeTx();
    expect(await run(tx)).toEqual({ awardIds: [], suggestionIds: [] });
    expect(suggestionCreate).not.toHaveBeenCalled();
    expect(awardCreate).not.toHaveBeenCalled();
  });

  it("routes a verses series of 3 to a suggestion and first to an award", async () => {
    setContext({ verseFacts: ["c1", "c2", "c3"] });
    const { tx, suggestionCreate, awardCreate } = makeTx();
    const result = await run(tx);

    expect(awardCreate).toHaveBeenCalledTimes(1);
    expect(awardCreate.mock.calls[0]?.[0].data).toMatchObject({ achievementId: FIRST });
    expect(suggestionCreate).toHaveBeenCalledTimes(1);
    const data = suggestionCreate.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      pupilId: PUPIL,
      achievementId: VERSES,
      tier: 1,
      academicYearId: YEAR,
      gradeId: "grade-a",
      status: "SUGGESTED",
      evidenceCheckIds: ["c1", "c2", "c3"],
      awardKey: buildAchievementAwardKey({
        pupilId: PUPIL,
        achievementId: VERSES,
        tier: 1,
        academicYearId: YEAR,
      }),
    });
    expect(data).not.toHaveProperty("points");
    expect(result).toEqual({ awardIds: ["award-1"], suggestionIds: ["sug-1"] });
  });

  it("writes one achievement.suggested entry with ids only", async () => {
    setContext({ verseFacts: ["c1", "c2", "c3", "c4", "c5"] });
    const { tx, suggestionCreate } = makeTx();
    await run(tx);

    expect(suggestionCreate).toHaveBeenCalledTimes(2);
    const suggested = mocks.writeAudit.mock.calls.filter(
      (call) => call[1].action === AUDIT_ACTION.ACHIEVEMENT_SUGGESTED,
    );
    expect(suggested).toHaveLength(1);
    expect(suggested[0]?.[1].newValue).toEqual({
      suggestionIds: ["sug-1", "sug-2"],
      pupilId: PUPIL,
    });
  });

  it("takes grade_id from the last evidence check of the series", async () => {
    setContext({ verseFacts: ["c1", "c2", "c3", "c4", "c5"] });
    const { tx, suggestionCreate } = makeTx();
    await run(tx);
    const rows = suggestionCreate.mock.calls.map((call) => call[0].data);
    expect(rows.find((row) => row.tier === 1)?.gradeId).toBe("grade-a");
    expect(rows.find((row) => row.tier === 2)?.gradeId).toBe("grade-b");
  });

  it("skips a suggestion on P2002 without throwing or auditing it", async () => {
    setContext({ verseFacts: ["c1", "c2", "c3"] });
    const { tx } = makeTx({ suggestionError: p2002() });
    const result = await run(tx);
    expect(result.suggestionIds).toEqual([]);
    expect(
      mocks.writeAudit.mock.calls.some(
        (call) => call[1].action === AUDIT_ACTION.ACHIEVEMENT_SUGGESTED,
      ),
    ).toBe(false);
  });

  it("does not insert when the year-scoped award key is already taken (no aborted transaction)", async () => {
    setContext({ verseFacts: ["c1", "c2", "c3"] });
    const { tx, suggestionCreate } = makeTx({ takenSuggestionKey: true });
    const result = await run(tx);
    expect(suggestionCreate).not.toHaveBeenCalled();
    expect(result.suggestionIds).toEqual([]);
  });

  it("rethrows non-P2002 errors", async () => {
    setContext({ verseFacts: ["c1", "c2", "c3"] });
    const { tx } = makeTx({ suggestionError: new Error("boom") });
    await expect(run(tx)).rejects.toThrow("boom");
  });

  it("does not re-propose a level occupied by an existing suggestion of any status", async () => {
    setContext({
      verseFacts: ["c1", "c2", "c3"],
      awards: [existing(VERSES, ["c1", "c2", "c3"]), existing(FIRST, ["c1"])],
    });
    const { tx, suggestionCreate, awardCreate } = makeTx();
    expect(await run(tx)).toEqual({ awardIds: [], suggestionIds: [] });
    expect(suggestionCreate).not.toHaveBeenCalled();
    expect(awardCreate).not.toHaveBeenCalled();
  });

  it("proposes level 2 separately while level 1 is pending (series grows 3 to 5)", async () => {
    setContext({
      verseFacts: ["c1", "c2", "c3", "c4", "c5"],
      awards: [existing(VERSES, ["c1", "c2", "c3"]), existing(FIRST, ["c1"])],
    });
    const { tx, suggestionCreate } = makeTx();
    const result = await run(tx);
    expect(result.suggestionIds).toHaveLength(1);
    expect(suggestionCreate.mock.calls[0]?.[0].data).toMatchObject({ tier: 2 });
  });
});
