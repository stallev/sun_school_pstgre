import "server-only";

import { z } from "zod";
import {
  ACHIEVEMENT_KIND,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { assertAdminActor } from "../school/school-enrollment-shared.server";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";

const tierInputSchema = z.object({
  tier: z.coerce.number().int().min(1).max(3),
  length: z.coerce.number().int().min(1),
  points: z.coerce.number().int().min(0),
});

const upsertRewardSchema = z
  .object({
    achievementId: z.string().uuid().optional(),
    nameRu: z.string().trim().min(1),
    nameEn: z.string().trim().min(1),
    descriptionRu: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    category: z.enum(["CONSISTENCY", "EFFORT", "MEMORY"]),
    ruleType: z.string().trim().min(1),
    metric: z.string().trim().min(1),
    tiers: z.array(tierInputSchema).min(1).max(3),
  })
  .strict();

const upsertPenaltySchema = z
  .object({
    achievementId: z.string().uuid().optional(),
    nameRu: z.string().trim().min(1),
    nameEn: z.string().trim().min(1),
    descriptionRu: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    maxPoints: z.coerce.number().int().min(1),
  })
  .strict();

function slugCodeFromName(nameEn: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : `penalty_${Date.now()}`;
}

async function hasCatalogUsage(tx: Prisma.TransactionClient, achievementId: string): Promise<boolean> {
  const [awards, penalties] = await Promise.all([
    tx.achievementAward.count({ where: { achievementId } }),
    tx.penalty.count({ where: { achievementId } }),
  ]);
  return awards + penalties > 0;
}

export async function upsertAchievementInTransaction(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  organizationId: string,
  raw: unknown,
  kind: typeof ACHIEVEMENT_KIND.REWARD | typeof ACHIEVEMENT_KIND.PENALTY,
): Promise<MutationResult<{ achievementId: string }>> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  const flagOn = await readFeaturesAchievementsEnabled(tx);
  if (!flagOn) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
      message: "admin.achievements.flag_off",
    };
  }

  const parsed =
    kind === ACHIEVEMENT_KIND.REWARD
      ? upsertRewardSchema.safeParse(raw)
      : upsertPenaltySchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const input = parsed.data;
  const existing = input.achievementId
    ? await tx.achievement.findUnique({ where: { id: input.achievementId } })
    : null;

  if (input.achievementId && !existing) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (existing && existing.kind !== kind) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_KIND_LOCKED,
      message: "admin.achievements.kind_locked",
    };
  }

  const kindLocked = existing ? await hasCatalogUsage(tx, existing.id) : false;

  try {
    let achievementId = existing?.id;
    if (kind === ACHIEVEMENT_KIND.PENALTY) {
      const penaltyInput = input as z.infer<typeof upsertPenaltySchema>;
      const threshold = -Math.abs(penaltyInput.maxPoints);
      const descriptionRu = penaltyInput.descriptionRu?.trim() || penaltyInput.nameRu;
      const descriptionEn = penaltyInput.descriptionEn?.trim() || penaltyInput.nameEn;
      if (existing) {
        await tx.achievement.update({
          where: { id: existing.id },
          data: {
            nameRu: penaltyInput.nameRu,
            nameEn: penaltyInput.nameEn,
            descriptionRu,
            descriptionEn,
            threshold: kindLocked ? existing.threshold : threshold,
          },
        });
        achievementId = existing.id;
      } else {
        const created = await tx.achievement.create({
          data: {
            code: slugCodeFromName(penaltyInput.nameEn),
            kind: ACHIEVEMENT_KIND.PENALTY,
            nameRu: penaltyInput.nameRu,
            nameEn: penaltyInput.nameEn,
            descriptionRu,
            descriptionEn,
            category: null,
            ruleType: "MANUAL",
            metric: null,
            threshold,
            isActive: true,
          },
        });
        achievementId = created.id;
      }
    } else {
      const rewardInput = input as z.infer<typeof upsertRewardSchema>;
      const descriptionRu = rewardInput.descriptionRu?.trim() || rewardInput.nameRu;
      const descriptionEn = rewardInput.descriptionEn?.trim() || rewardInput.nameEn;
      const definition = {
        nameRu: rewardInput.nameRu,
        nameEn: rewardInput.nameEn,
        descriptionRu,
        descriptionEn,
        category: rewardInput.category,
        ruleType: kindLocked && existing ? existing.ruleType : rewardInput.ruleType,
        metric: kindLocked && existing ? existing.metric : rewardInput.metric,
        threshold: null,
      };
      if (existing) {
        await tx.achievement.update({ where: { id: existing.id }, data: definition });
        achievementId = existing.id;
      } else {
        const created = await tx.achievement.create({
          data: {
            code: slugCodeFromName(rewardInput.nameEn),
            kind: ACHIEVEMENT_KIND.REWARD,
            isActive: true,
            ...definition,
          },
        });
        achievementId = created.id;
      }

      for (const tier of rewardInput.tiers) {
        await tx.achievementTier.upsert({
          where: { achievementId_tier: { achievementId: achievementId!, tier: tier.tier } },
          create: {
            achievementId: achievementId!,
            tier: tier.tier,
            length: tier.length,
            points: tier.points,
          },
          update: { length: tier.length, points: tier.points },
        });
      }
    }

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT,
      entityId: achievementId!,
      action: AUDIT_ACTION.ACHIEVEMENT_CATALOG_UPSERTED,
      newValue: { kind },
    });

    return { ok: true, data: { achievementId: achievementId! } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.CONFLICT,
        message: "common.errors.conflict",
      };
    }
    throw error;
  }
}

export async function upsertAchievement(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  kind: typeof ACHIEVEMENT_KIND.REWARD | typeof ACHIEVEMENT_KIND.PENALTY,
): Promise<MutationResult<{ achievementId: string }>> {
  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return upsertAchievementInTransaction(tx, actorUserId, organizationId, raw, kind);
  });
}
