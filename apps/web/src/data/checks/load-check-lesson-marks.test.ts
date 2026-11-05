import { ACHIEVEMENT_KIND, PENALTY_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_WORK_ACHIEVEMENT_CODE, WORSHIP_RECITAL_ACHIEVEMENT_CODE } from "@/lib/achievements/catalog-display";
import { loadCheckLessonMarks } from "./load-check-lesson-marks.server";

const readFeaturesAchievementsEnabled = vi.fn();
const loadGradeAchievementUi = vi.fn();
const loadGroupAchievementPointsOverrides = vi.fn();

vi.mock("@/data/achievements/achievement-feature.server", () => ({
  readFeaturesAchievementsEnabled: (...args: unknown[]) => readFeaturesAchievementsEnabled(...args),
}));

vi.mock("@/data/achievements/load-grade-achievement-ui.server", () => ({
  loadGradeAchievementUi: (...args: unknown[]) => loadGradeAchievementUi(...args),
}));

vi.mock("@/data/achievements/group-achievement-points.server", () => ({
  loadGroupAchievementPointsOverrides: (...args: unknown[]) =>
    loadGroupAchievementPointsOverrides(...args),
  resolveEffectivePoints: (catalogPoints: number) => ({ points: catalogPoints }),
  resolvePenaltyCatalogPoints: (
    threshold: number | null,
    tierPoints: number | undefined,
  ) => {
    if (threshold === null && tierPoints === undefined) return null;
    return { points: tierPoints ?? -Math.abs(threshold ?? 0) };
  },
}));

const baseInput = {
  gradeId: "grade-1",
  academicYearId: "year-1",
  lessonId: "lesson-1",
  lessonDateIso: "2026-01-15",
  pupilIds: ["pupil-1"],
  canMutate: true,
  locale: "ru" as const,
  timeZone: "Europe/Moscow",
};

const worshipId = "ach-worship";
const activeWorkId = "ach-active";

function buildDb(): PrismaClient {
  return {
    achievement: {
      findMany: vi.fn(async (args: { where: { code?: { in: string[] }; kind?: string } }) => {
        if (args.where.code?.in) {
          return [
            {
              id: worshipId,
              code: WORSHIP_RECITAL_ACHIEVEMENT_CODE,
              nameRu: "Стихотворение",
              nameEn: "Recital",
              tiers: [{ tier: 1, points: 5 }],
            },
            {
              id: activeWorkId,
              code: ACTIVE_WORK_ACHIEVEMENT_CODE,
              nameRu: "Активная работа",
              nameEn: "Active work",
              tiers: [{ tier: 1, points: 3 }],
            },
          ];
        }
        if (args.where.kind === ACHIEVEMENT_KIND.PENALTY) {
          return [
            {
              id: "pen-1",
              nameRu: "Опоздание",
              nameEn: "Late",
              threshold: 5,
              tiers: [{ points: -5 }],
            },
          ];
        }
        return [];
      }),
    },
    academicYear: {
      findUnique: vi.fn(async () => ({ startsOn: new Date("2025-09-01T00:00:00.000Z") })),
    },
    appSetting: {
      findUnique: vi.fn(async () => null),
    },
    achievementAward: {
      findMany: vi.fn(async () => [
        { pupilId: "pupil-1", achievementId: worshipId },
      ]),
    },
    penalty: {
      findMany: vi.fn(async () => [
        {
          id: "penalty-row-1",
          pupilId: "pupil-1",
          points: -5,
          achievement: { nameRu: "Опоздание", nameEn: "Late" },
        },
      ]),
    },
  } as unknown as PrismaClient;
}

describe("loadCheckLessonMarks", () => {
  beforeEach(() => {
    readFeaturesAchievementsEnabled.mockResolvedValue(true);
    loadGradeAchievementUi.mockResolvedValue({ achievementsEnabled: true });
    loadGroupAchievementPointsOverrides.mockResolvedValue(new Map());
  });

  it("returns disabled when lesson is not mutable", async () => {
    const db = buildDb();
    const result = await loadCheckLessonMarks(db, { ...baseInput, canMutate: false });
    expect(result).toEqual({ marksEnabled: false });
    expect(readFeaturesAchievementsEnabled).not.toHaveBeenCalled();
  });

  it("returns disabled when achievements feature flag is off", async () => {
    readFeaturesAchievementsEnabled.mockResolvedValue(false);
    const db = buildDb();
    const result = await loadCheckLessonMarks(db, baseInput);
    expect(result).toEqual({ marksEnabled: false });
  });

  it("returns disabled when grade achievements mode is off", async () => {
    loadGradeAchievementUi.mockResolvedValue({ achievementsEnabled: false });
    const db = buildDb();
    const result = await loadCheckLessonMarks(db, baseInput);
    expect(result).toEqual({ marksEnabled: false });
  });

  it("loads event captions for lesson date including revoked rows and active penalty", async () => {
    const db = buildDb();
    const result = await loadCheckLessonMarks(db, baseInput);
    expect(result.marksEnabled).toBe(true);
    if (!result.marksEnabled) return;

    expect(result.awardOptions).toHaveLength(2);
    expect(result.byPupilId["pupil-1"]?.eventCaptions.some((line) => line.includes("Стихотворение"))).toBe(
      true,
    );
    expect(result.byPupilId["pupil-1"]?.penalty).toEqual({
      id: "penalty-row-1",
      name: "Опоздание",
      points: 5,
    });

    expect(db.achievementAward.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          awardKey: { endsWith: ":2026-01-15" },
        }),
      }),
    );
    const awardWhere = vi.mocked(db.achievementAward.findMany).mock.calls[0]?.[0]?.where as Record<
      string,
      unknown
    >;
    expect(awardWhere).not.toHaveProperty("revokedAt");

    expect(db.penalty.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          lessonId: "lesson-1",
          status: PENALTY_STATUS.ACTIVE,
        }),
      }),
    );
  });

  it("does not add captions when award query returns no rows", async () => {
    const db = buildDb();
    vi.mocked(db.achievementAward.findMany).mockResolvedValue([]);
    const result = await loadCheckLessonMarks(db, baseInput);
    expect(result.marksEnabled).toBe(true);
    if (!result.marksEnabled) return;
    expect(result.byPupilId["pupil-1"]?.eventCaptions).toEqual([]);
  });
});
