import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  GROUP_ACHIEVEMENT_PENALTY_TIER,
  MUTATION_ERROR_CODES,
  parseSetGroupAchievementPointsInput,
  type GroupAchievementPointsItem,
  type MutationResult,
  type SetGroupAchievementPointsInput,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import type { Prisma } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { loadAcademicYearForOrganization } from "../school/school-year-guards.server";
import {
  assertSetGroupAchievementPointsAccess,
} from "./achievement-mutate-access.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { globalCatalogPenaltyPoints } from "./group-achievement-points.server";

type Tx = Prisma.TransactionClient;

type CatalogAchievement = {
  id: string;
  threshold: number | null;
  tiers: { tier: number; points: number }[];
};

export type GroupPointsAuditRow = {
  achievementId: string;
  tier: number;
  before: number | null;
  after: number | null;
};

function globalPointsForTier(achievement: CatalogAchievement, tier: number): number | null {
  if (tier === GROUP_ACHIEVEMENT_PENALTY_TIER) {
    const tierZero = achievement.tiers.find((row) => row.tier === GROUP_ACHIEVEMENT_PENALTY_TIER);
    return globalCatalogPenaltyPoints(achievement.threshold, tierZero?.points);
  }
  const tierRow = achievement.tiers.find((row) => row.tier === tier);
  return tierRow?.points ?? null;
}

async function lockGradeSettingsId(
  tx: Tx,
  gradeId: string,
  academicYearId: string,
): Promise<string | null> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM grade_settings
    WHERE grade_id = ${gradeId}::uuid AND academic_year_id = ${academicYearId}::uuid
    FOR UPDATE
  `;
  return rows[0]?.id ?? null;
}

async function loadCatalogAchievements(
  tx: Tx,
  achievementIds: string[],
): Promise<Map<string, CatalogAchievement>> {
  if (achievementIds.length === 0) return new Map();
  const rows = await tx.achievement.findMany({
    where: { id: { in: achievementIds } },
    select: {
      id: true,
      threshold: true,
      tiers: { select: { tier: true, points: true } },
    },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

function validateCatalogTier(
  achievement: CatalogAchievement | undefined,
  tier: number,
): boolean {
  if (!achievement) return false;
  return globalPointsForTier(achievement, tier) !== null;
}

export async function applyGroupAchievementPointsItems(
  tx: Tx,
  settingsId: string,
  items: readonly GroupAchievementPointsItem[],
  catalog: Map<string, CatalogAchievement>,
): Promise<GroupPointsAuditRow[]> {
  for (const item of items) {
    const achievement = catalog.get(item.achievementId);
    if (!validateCatalogTier(achievement, item.tier)) {
      throw new Error(MUTATION_ERROR_CODES.VALIDATION);
    }
  }

  const existing = await tx.gradeAchievementPoints.findMany({
    where: { gradeSettingsId: settingsId },
    select: { achievementId: true, tier: true, points: true },
  });
  const existingByKey = new Map(
    existing.map((row) => [`${row.achievementId}:${row.tier}`, row.points]),
  );

  const changes: GroupPointsAuditRow[] = [];

  for (const item of items) {
    const achievement = catalog.get(item.achievementId)!;
    const globalPoints = globalPointsForTier(achievement, item.tier)!;
    const key = `${item.achievementId}:${item.tier}`;
    const beforeStored = existingByKey.get(key);
    const before = beforeStored === undefined ? null : beforeStored;

    let after: number | null;
    if (item.points === null || item.points === globalPoints) {
      after = null;
      if (beforeStored !== undefined) {
        await tx.gradeAchievementPoints.deleteMany({
          where: {
            gradeSettingsId: settingsId,
            achievementId: item.achievementId,
            tier: item.tier,
          },
        });
        existingByKey.delete(key);
      }
    } else {
      after = item.points;
      if (beforeStored === item.points) {
        continue;
      }
      await tx.gradeAchievementPoints.upsert({
        where: {
          gradeSettingsId_achievementId_tier: {
            gradeSettingsId: settingsId,
            achievementId: item.achievementId,
            tier: item.tier,
          },
        },
        create: {
          gradeSettingsId: settingsId,
          achievementId: item.achievementId,
          tier: item.tier,
          points: item.points,
        },
        update: { points: item.points },
      });
      existingByKey.set(key, item.points);
    }

    if (before !== after) {
      changes.push({
        achievementId: item.achievementId,
        tier: item.tier,
        before,
        after,
      });
    }
  }

  return changes;
}

export type SetGroupAchievementPointsSuccess = { changed: number };

export async function setGroupAchievementPoints(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<SetGroupAchievementPointsSuccess>> {
  const parsed = parseSetGroupAchievementPointsInput(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const input: SetGroupAchievementPointsInput = parsed.data;

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const year = await loadAcademicYearForOrganization(tx, input.academicYearId, organizationId);
    if ("ok" in year) return year;

    const access = await assertSetGroupAchievementPointsAccess(
      tx,
      actorUserId,
      organizationId,
      input.gradeId,
      input.academicYearId,
      year.status,
    );
    if (access) return access;

    const flagOn = await readFeaturesAchievementsEnabled(tx);
    if (!flagOn) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
        message: "admin.achievements.flag_off",
      };
    }

    const settingsId = await lockGradeSettingsId(tx, input.gradeId, input.academicYearId);
    if (!settingsId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const achievementIds = [...new Set(input.items.map((item) => item.achievementId))];
    const catalog = await loadCatalogAchievements(tx, achievementIds);

    try {
      const changes = await applyGroupAchievementPointsItems(tx, settingsId, input.items, catalog);
      if (changes.length === 0) {
        return { ok: true, data: { changed: 0 } };
      }

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.GRADE_SETTINGS,
        entityId: settingsId,
        action: AUDIT_ACTION.ACHIEVEMENT_GROUP_POINTS_CHANGED,
        newValue: {
          gradeId: input.gradeId,
          academicYearId: input.academicYearId,
          items: changes,
        },
      });

      return { ok: true, data: { changed: changes.length } };
    } catch (error) {
      if (error instanceof Error && error.message === MUTATION_ERROR_CODES.VALIDATION) {
        return {
          ok: false,
          code: MUTATION_ERROR_CODES.VALIDATION,
          message: "common.errors.validation",
        };
      }
      throw error;
    }
  });
}
