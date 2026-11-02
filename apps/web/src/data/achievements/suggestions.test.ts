import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  ACCOUNT_STATUS,
  ACHIEVEMENT_SUGGESTION_STATUS,
  AUDIT_ACTION,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  type UserRole,
} from "@sunschool/domain";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn() }));

import { confirmAchievementSuggestion } from "./confirm-suggestion";
import { deferAchievementSuggestion } from "./defer-suggestion";
import { dismissAchievementSuggestion } from "./dismiss-suggestion";

const orgId = "33333333-3333-4333-8333-333333333333";
const actorId = "55555555-5555-4555-8555-555555555555";
const suggestionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pupilId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const achievementId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const gradeId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const yearId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const checkIds = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];

type Overrides = {
  roles?: UserRole[];
  flag?: boolean;
  yearStatus?: string;
  assigned?: boolean;
  suggestion?: object | null;
  mode?: { achievementsEnabled: boolean; achievementPeriods: object[] };
  achievementActive?: boolean;
  taken?: boolean;
  claimed?: number;
  freshStatus?: string;
};

function build(o: Overrides = {}) {
  const suggestion =
    o.suggestion === undefined
      ? {
          id: suggestionId,
          pupilId,
          achievementId,
          tier: 1,
          academicYearId: yearId,
          gradeId,
          awardKey: "key-1",
          evidenceCheckIds: checkIds,
          status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED,
          academicYear: { status: o.yearStatus ?? ACADEMIC_YEAR_STATUS.ACTIVE },
        }
      : o.suggestion;
  const tx = {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({
        organizationId: orgId,
        id: actorId,
        status: ACCOUNT_STATUS.ACTIVE,
        roles: (o.roles ?? [USER_ROLE.TEACHER]).map((role) => ({ role })),
      }),
    },
    appSetting: { findUnique: vi.fn().mockResolvedValue({ value: o.flag ?? true }) },
    teacherAssignment: {
      findFirst: vi.fn().mockResolvedValue(o.assigned === false ? null : { id: "ta" }),
    },
    gradeSettings: {
      findUnique: vi.fn().mockResolvedValue(
        o.mode ?? { achievementsEnabled: true, achievementPeriods: [], achievementPoints: [] },
      ),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
    achievementSuggestion: {
      findFirst: vi.fn().mockResolvedValue(suggestion),
      findUnique: vi
        .fn()
        .mockResolvedValue({ status: o.freshStatus ?? ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED }),
      updateMany: vi.fn().mockResolvedValue({ count: o.claimed ?? 1 }),
    },
    achievement: {
      findUnique: vi.fn().mockResolvedValue({
        code: "verses",
        ruleType: "SERIES",
        metric: null,
        threshold: null,
        isActive: o.achievementActive ?? true,
        tiers: [{ tier: 1, length: 3, points: 10 }],
      }),
    },
    achievementAward: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "award-1" }),
    },
    achievementEvidence: {
      findFirst: vi.fn().mockResolvedValue(o.taken ? { id: "ev" } : null),
    },
    homeworkCheck: { count: vi.fn().mockResolvedValue(checkIds.length) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  const db = {
    $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { tx, db };
}

const auditCalls = (tx: ReturnType<typeof build>["tx"]) => {
  const { create } = tx.auditLog;
  return create.mock.calls as unknown as { data: { action: string; newValue?: unknown; reason?: string } }[][];
};

const auditActions = (tx: ReturnType<typeof build>["tx"]) =>
  auditCalls(tx).map((call) => (call[0] as { data: { action: string } }).data.action);

describe("confirmAchievementSuggestion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an AUTO award with group points, suggestionId in the snapshot and links it", async () => {
    const { tx, db } = build({
      mode: {
        achievementsEnabled: true,
        achievementPeriods: [],
        achievementPoints: [{ achievementId, tier: 1, points: 7 }],
      } as never,
    });
    const result = await confirmAchievementSuggestion(db as never, actorId, { suggestionId });

    expect(result).toEqual({ ok: true, data: { suggestionId, awardId: "award-1", pupilId } });
    const data = tx.achievementAward.create.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      points: 7,
      source: "AUTO",
      awardedById: actorId,
      awardKey: "key-1",
      ruleSnapshot: { suggestionId, gradeId, pointsSource: "grade", points: 7 },
    });
    expect(data.evidence.create).toHaveLength(2);
    expect(tx.achievementSuggestion.updateMany).toHaveBeenCalledWith({
      where: { id: suggestionId, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
      data: expect.objectContaining({ status: "CONFIRMED", awardId: "award-1", resolvedById: actorId }),
    });
    expect(auditActions(tx)).toEqual([AUDIT_ACTION.ACHIEVEMENT_SUGGESTION_CONFIRMED]);
  });

  it("loses the race: claim count 0 rolls back with ACHIEVEMENT_SUGGESTION_RESOLVED", async () => {
    const { tx, db } = build({ claimed: 0 });
    const result = await confirmAchievementSuggestion(db as never, actorId, { suggestionId });
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_RESOLVED });
    expect(auditCalls(tx)).toHaveLength(0);
  });

  it("returns RESOLVED when the status is no longer SUGGESTED (before and under the lock)", async () => {
    const stale = build({ freshStatus: ACHIEVEMENT_SUGGESTION_STATUS.DISMISSED });
    expect(await confirmAchievementSuggestion(stale.db as never, actorId, { suggestionId })).toMatchObject({
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_RESOLVED,
    });
    expect(stale.tx.achievementAward.create).not.toHaveBeenCalled();
  });

  it("returns ACHIEVEMENT_EVIDENCE_TAKEN without writes when evidence is occupied", async () => {
    const { tx, db } = build({ taken: true });
    const result = await confirmAchievementSuggestion(db as never, actorId, { suggestionId });
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_TAKEN });
    expect(tx.achievementAward.create).not.toHaveBeenCalled();
    expect(tx.achievementSuggestion.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a teacher in a closed year, lets admin through with a closed-year journal flag", async () => {
    const closed = build({ yearStatus: ACADEMIC_YEAR_STATUS.CLOSED });
    expect(await confirmAchievementSuggestion(closed.db as never, actorId, { suggestionId })).toMatchObject({
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_YEAR_CLOSED,
    });
    expect(closed.tx.achievementAward.create).not.toHaveBeenCalled();

    const admin = build({ yearStatus: ACADEMIC_YEAR_STATUS.CLOSED, roles: [USER_ROLE.ADMIN] });
    expect(await confirmAchievementSuggestion(admin.db as never, actorId, { suggestionId })).toMatchObject({
      ok: true,
    });
    expect(auditCalls(admin.tx)[0]![0]!.data.newValue).toMatchObject({
      closedYearOverride: true,
    });
  });

  it("maps flag off, mode off and inactive row", async () => {
    expect(
      await confirmAchievementSuggestion(build({ flag: false }).db as never, actorId, { suggestionId }),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF });
    expect(
      await confirmAchievementSuggestion(
        build({ mode: { achievementsEnabled: false, achievementPeriods: [] } }).db as never,
        actorId,
        { suggestionId },
      ),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_MODE_OFF });
    expect(
      await confirmAchievementSuggestion(build({ achievementActive: false }).db as never, actorId, {
        suggestionId,
      }),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_INACTIVE });
  });

  it("hides a foreign group and rejects parents", async () => {
    expect(
      await confirmAchievementSuggestion(build({ assigned: false }).db as never, actorId, { suggestionId }),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_NOT_FOUND });
    expect(
      await confirmAchievementSuggestion(build({ suggestion: null }).db as never, actorId, { suggestionId }),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_NOT_FOUND });
    expect(
      await confirmAchievementSuggestion(build({ roles: [USER_ROLE.PARENT] }).db as never, actorId, {
        suggestionId,
      }),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.FORBIDDEN });
  });

  it("does not accept client points or key (strict input)", async () => {
    const { db } = build();
    const result = await confirmAchievementSuggestion(db as never, actorId, { suggestionId, points: 99 });
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.VALIDATION });
  });
});

describe("deferAchievementSuggestion", () => {
  it("sets deferred_at, keeps the status and journals", async () => {
    const { tx, db } = build();
    const result = await deferAchievementSuggestion(db as never, actorId, { suggestionId });
    expect(result.ok).toBe(true);
    expect(tx.achievementSuggestion.updateMany).toHaveBeenCalledWith({
      where: { id: suggestionId, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
      data: { deferredAt: expect.any(Date) },
    });
    expect(auditActions(tx)).toEqual([AUDIT_ACTION.ACHIEVEMENT_SUGGESTION_DEFERRED]);
  });

  it("requires the group mode and reports a lost race", async () => {
    expect(
      await deferAchievementSuggestion(
        build({ mode: { achievementsEnabled: false, achievementPeriods: [] } }).db as never,
        actorId,
        { suggestionId },
      ),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_MODE_OFF });
    expect(
      await deferAchievementSuggestion(build({ claimed: 0 }).db as never, actorId, { suggestionId }),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_RESOLVED });
  });
});

describe("dismissAchievementSuggestion", () => {
  it("dismisses with the reason in the journal, even with the group mode off", async () => {
    const { tx, db } = build({ mode: { achievementsEnabled: false, achievementPeriods: [] } });
    const result = await dismissAchievementSuggestion(db as never, actorId, {
      suggestionId,
      reason: "  не засчитано ",
    });
    expect(result.ok).toBe(true);
    expect(tx.achievementSuggestion.updateMany).toHaveBeenCalledWith({
      where: { id: suggestionId, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
      data: expect.objectContaining({ status: "DISMISSED", resolvedById: actorId }),
    });
    expect(auditCalls(tx)[0]![0]!.data).toMatchObject({
      action: AUDIT_ACTION.ACHIEVEMENT_SUGGESTION_DISMISSED,
      reason: "не засчитано",
    });
  });

  it("rejects a reason longer than 500 characters before any read", async () => {
    const { tx, db } = build();
    const result = await dismissAchievementSuggestion(db as never, actorId, {
      suggestionId,
      reason: "x".repeat(501),
    });
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.VALIDATION });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.achievementSuggestion.updateMany).not.toHaveBeenCalled();
  });

  it("reports a lost race and a closed year for a teacher", async () => {
    expect(
      await dismissAchievementSuggestion(build({ claimed: 0 }).db as never, actorId, { suggestionId }),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_RESOLVED });
    expect(
      await dismissAchievementSuggestion(
        build({ yearStatus: ACADEMIC_YEAR_STATUS.CLOSED }).db as never,
        actorId,
        { suggestionId },
      ),
    ).toMatchObject({ code: MUTATION_ERROR_CODES.ACHIEVEMENT_YEAR_CLOSED });
  });
});
