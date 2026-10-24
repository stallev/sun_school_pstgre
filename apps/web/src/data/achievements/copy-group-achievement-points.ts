import "server-only";

import { z } from "zod";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  type GroupAchievementPointsItem,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import type { Prisma } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { loadAcademicYearForOrganization } from "../school/school-year-guards.server";
import { assertCopyGroupAchievementPointsAccess } from "./achievement-mutate-access.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import {
  applyGroupAchievementPointsItems,
  type GroupPointsAuditRow,
} from "./set-group-achievement-points";

type Tx = Prisma.TransactionClient;

const copyGroupAchievementPointsInputSchema = z
  .object({
    gradeId: z.uuid(),
    academicYearId: z.uuid(),
    sourceGradeId: z.uuid(),
  })
  .strict();

export type CopyGroupAchievementPointsSuccess = { changed: number };

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

function buildCopyItems(
  sourceRows: { achievementId: string; tier: number; points: number }[],
  targetRows: { achievementId: string; tier: number; points: number }[],
): GroupAchievementPointsItem[] {
  const sourceKeys = new Set(sourceRows.map((row) => `${row.achievementId}:${row.tier}`));
  const items: GroupAchievementPointsItem[] = [];

  for (const row of sourceRows) {
    items.push({
      achievementId: row.achievementId,
      tier: row.tier,
      points: row.points,
    });
  }

  for (const row of targetRows) {
    const key = `${row.achievementId}:${row.tier}`;
    if (!sourceKeys.has(key)) {
      items.push({
        achievementId: row.achievementId,
        tier: row.tier,
        points: null,
      });
    }
  }

  return items;
}

function mergeCopyChanges(
  targetBefore: { achievementId: string; tier: number; points: number }[],
  changes: GroupPointsAuditRow[],
): GroupPointsAuditRow[] {
  const beforeMap = new Map(
    targetBefore.map((row) => [`${row.achievementId}:${row.tier}`, row.points]),
  );
  return changes.map((change) => ({
    ...change,
    before: beforeMap.has(`${change.achievementId}:${change.tier}`)
      ? beforeMap.get(`${change.achievementId}:${change.tier}`)!
      : change.before,
  }));
}

export async function copyGroupAchievementPoints(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<CopyGroupAchievementPointsSuccess>> {
  const parsed = copyGroupAchievementPointsInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const { gradeId, academicYearId, sourceGradeId } = parsed.data;

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const year = await loadAcademicYearForOrganization(tx, academicYearId, organizationId);
    if ("ok" in year) return year;

    const sourceSettings = await tx.gradeSettings.findUnique({
      where: { gradeId_academicYearId: { gradeId: sourceGradeId, academicYearId } },
      select: { id: true },
    });

    const access = await assertCopyGroupAchievementPointsAccess(
      tx,
      actorUserId,
      organizationId,
      gradeId,
      sourceGradeId,
      academicYearId,
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

    const targetSettingsId = await lockGradeSettingsId(tx, gradeId, academicYearId);
    if (!targetSettingsId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const [sourceRows, targetBefore] = await Promise.all([
      sourceSettings
        ? tx.gradeAchievementPoints.findMany({
            where: { gradeSettingsId: sourceSettings.id },
            select: { achievementId: true, tier: true, points: true },
          })
        : Promise.resolve([]),
      tx.gradeAchievementPoints.findMany({
        where: { gradeSettingsId: targetSettingsId },
        select: { achievementId: true, tier: true, points: true },
      }),
    ]);

    const items = buildCopyItems(sourceRows, targetBefore);
    if (items.length === 0) {
      return { ok: true, data: { changed: 0 } };
    }

    const achievementIds = [...new Set(items.map((item) => item.achievementId))];
    const catalogRows = await tx.achievement.findMany({
      where: { id: { in: achievementIds } },
      select: {
        id: true,
        threshold: true,
        tiers: { select: { tier: true, points: true } },
      },
    });
    const catalog = new Map(catalogRows.map((row) => [row.id, row]));

    try {
      const changes = await applyGroupAchievementPointsItems(
        tx,
        targetSettingsId,
        items,
        catalog,
      );
      if (changes.length === 0) {
        return { ok: true, data: { changed: 0 } };
      }

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.GRADE_SETTINGS,
        entityId: targetSettingsId,
        action: AUDIT_ACTION.ACHIEVEMENT_GROUP_POINTS_CHANGED,
        newValue: {
          gradeId,
          academicYearId,
          sourceGradeId,
          items: mergeCopyChanges(targetBefore, changes),
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
