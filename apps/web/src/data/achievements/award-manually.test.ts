import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACHIEVEMENT_KIND,
  ACHIEVEMENT_RULE_TYPE,
  AUDIT_ACTION,
  MUTATION_ERROR_CODES,
  buildAchievementAwardKey,
} from "@sunschool/domain";
import { awardManually } from "./award-manually";

const writeAuditMock = vi.hoisted(() => vi.fn());
const loadOverridesMock = vi.hoisted(() => vi.fn());
const loadModeMock = vi.hoisted(() => vi.fn());
const accessMock = vi.hoisted(() => vi.fn());
const revalidateMock = vi.hoisted(() => vi.fn());

vi.mock("@sunschool/db", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  writeAudit: writeAuditMock,
}));
vi.mock("../school/school-pupil-shared.server", () => ({
  loadActorOrganizationId: vi.fn().mockResolvedValue("org"),
  lockPupilRow: vi.fn().mockResolvedValue(true),
}));
vi.mock("../school/school-enrollment-shared.server", () => ({
  loadActiveEnrollment: vi.fn().mockResolvedValue({
    id: "e1",
    gradeId: "g-now",
    academicYearId: "11111111-1111-4111-8111-111111111111",
    startsOn: new Date("2026-09-01"),
  }),
}));
vi.mock("./achievement-mutate-access.server", () => ({ assertAwardManuallyAccess: accessMock }));
vi.mock("./achievement-mode.server", () => ({ loadGradeAchievementMode: loadModeMock }));
vi.mock("./achievement-feature.server", () => ({
  readFeaturesAchievementsEnabled: vi.fn().mockResolvedValue(true),
}));
vi.mock("./group-achievement-points.server", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  loadGroupAchievementPointsOverrides: loadOverridesMock,
}));
vi.mock("../bricks/revalidate-bricks-cache", () => ({ revalidateBricksCaches: revalidateMock }));

const pupilId = "22222222-2222-4222-8222-222222222222";
const achievementId = "33333333-3333-4333-8333-333333333333";
const yearId = "11111111-1111-4111-8111-111111111111";
const actorUserId = "55555555-5555-4555-8555-555555555555";

type DbOptions = { enrollmentGradeId?: string | null; awardExists?: boolean };

const eventAchievement = {
  id: achievementId,
  code: "worship_recital",
  kind: ACHIEVEMENT_KIND.REWARD,
  ruleType: ACHIEVEMENT_RULE_TYPE.EVENT,
  metric: null,
  threshold: null,
  isActive: true,
  tiers: [{ tier: 1, length: 1, points: 6 }],
};

const buildDb = (opts: DbOptions = {}) => {
  const created: unknown[] = [];
  const enrollmentRow = opts.enrollmentGradeId === null ? null : { gradeId: opts.enrollmentGradeId ?? "g-then" };
  const tx = {
    achievement: { findUnique: vi.fn().mockResolvedValue(eventAchievement) },
    academicYear: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ startsOn: new Date("2026-09-01"), endsOn: new Date("2027-05-31") }),
    },
    appSetting: { findUnique: vi.fn().mockResolvedValue({ value: "UTC" }) },
    enrollment: { findFirst: vi.fn().mockResolvedValue(enrollmentRow) },
    achievementAward: {
      findUnique: vi.fn().mockResolvedValue(opts.awardExists ? { id: "x" } : null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(async (args: unknown) => {
        created.push(args);
        return { id: "award-1" };
      }),
    },
    homeworkCheck: { findMany: vi.fn() },
  };
  const db = { $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)) };
  return { db, tx, created };
};

const input = (extra: Record<string, unknown> = {}) => ({
  pupilId,
  achievementId,
  tier: 1,
  points: 6,
  reason: "Recited a poem",
  academicYearId: yearId,
  eventOn: "2026-10-04",
  ...extra,
});

const keyOf = (rows: unknown[]) => (rows[0] as { data: { awardKey: string } }).data.awardKey;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-02T10:00:00Z"));
  writeAuditMock.mockReset();
  revalidateMock.mockReset();
  accessMock.mockReset().mockResolvedValue(null);
  loadModeMock.mockReset().mockResolvedValue({ achievementsEnabled: true });
  loadOverridesMock.mockReset().mockResolvedValue(new Map());
});

describe("awardManually EVENT branch", () => {
  it("awards with the event date in the key, no evidence, and audits it", async () => {
    const { db, created } = buildDb();
    const result = await awardManually(db as never, actorUserId, input());

    expect(result).toEqual({ ok: true, data: { awardId: "award-1" } });
    expect(keyOf(created)).toBe(
      buildAchievementAwardKey({
        pupilId,
        achievementId,
        tier: 1,
        academicYearId: yearId,
        eventOn: "2026-10-04",
      }),
    );
    const data = (created[0] as { data: { evidence: unknown } }).data;
    expect(data.evidence).toBeUndefined();
    expect(writeAuditMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: AUDIT_ACTION.ACHIEVEMENT_AWARDED }),
    );
    expect(revalidateMock).toHaveBeenCalledWith(pupilId, yearId);
  });

  it("allows a second award on a different date", async () => {
    const first = buildDb();
    const second = buildDb();
    await awardManually(first.db as never, actorUserId, input());
    const result = await awardManually(second.db as never, actorUserId, input({ eventOn: "2026-10-11" }));
    expect(result.ok).toBe(true);
    expect(keyOf(first.created)).not.toBe(keyOf(second.created));
  });

  it("returns CONFLICT without creating when the same date is already awarded", async () => {
    const { db, created } = buildDb({ awardExists: true });
    const result = await awardManually(db as never, actorUserId, input());
    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CONFLICT,
      message: "common.errors.conflict",
    });
    expect(created).toHaveLength(0);
  });

  it("rejects points above the group ceiling on the event date", async () => {
    loadOverridesMock.mockResolvedValue(new Map([[`${achievementId}:1`, 4]]));
    const { db, created } = buildDb();
    const result = await awardManually(db as never, actorUserId, input({ points: 5 }));
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.ACHIEVEMENT_POINTS_EXCEED });
    expect(loadOverridesMock).toHaveBeenCalledWith(expect.anything(), "g-then", yearId);
    expect(created).toHaveLength(0);
  });

  it("returns ACHIEVEMENT_MODE_OFF when the group mode is off", async () => {
    loadModeMock.mockResolvedValue({ achievementsEnabled: false });
    const { db, created } = buildDb();
    const result = await awardManually(db as never, actorUserId, input());
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.ACHIEVEMENT_MODE_OFF });
    expect(created).toHaveLength(0);
  });

  it.each([
    ["before the year", "2026-08-31"],
    ["after the year", "2027-06-01"],
    ["in the future", "2026-11-03"],
    ["not a real date", "2026-02-30"],
  ])("rejects a date %s", async (_label, eventOn) => {
    const { db, created } = buildDb();
    const result = await awardManually(db as never, actorUserId, input({ eventOn }));
    expect(result).toMatchObject({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      fields: { eventOn: "teacher.achievements.event_date_invalid" },
    });
    expect(created).toHaveLength(0);
  });

  it("requires eventOn and rejects lessons for an event", async () => {
    const { db } = buildDb();
    const missing = await awardManually(db as never, actorUserId, input({ eventOn: undefined }));
    expect(missing).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.VALIDATION });
    const withChecks = await awardManually(
      db as never,
      actorUserId,
      input({ checkIds: ["44444444-4444-4444-8444-444444444444"] }),
    );
    expect(withChecks).toMatchObject({ ok: false, fields: { checkIds: expect.any(String) } });
  });

  it("rejects a date when the pupil had no enrollment that day", async () => {
    const { db } = buildDb({ enrollmentGradeId: null });
    const result = await awardManually(db as never, actorUserId, input());
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.VALIDATION });
  });

  it("returns the access denial for a foreign pupil before touching the catalog", async () => {
    accessMock.mockResolvedValue({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
    const { db, tx } = buildDb();
    const result = await awardManually(db as never, actorUserId, input());
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND });
    expect(tx.achievement.findUnique).not.toHaveBeenCalled();
  });

  it("does not accept eventOn for a non-event achievement", async () => {
    const { db, tx } = buildDb();
    tx.achievement.findUnique.mockResolvedValue({
      ...eventAchievement,
      ruleType: ACHIEVEMENT_RULE_TYPE.MANUAL,
    });
    const result = await awardManually(db as never, actorUserId, input());
    expect(result).toMatchObject({ ok: false, code: MUTATION_ERROR_CODES.VALIDATION });
  });
});
