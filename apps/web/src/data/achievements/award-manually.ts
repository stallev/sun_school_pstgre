import "server-only";

import { z } from "zod";
import {
  ACHIEVEMENT_KIND,
  ACHIEVEMENT_RULE_TYPE,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  AWARD_SOURCE,
  MUTATION_ERROR_CODES,
  buildAchievementAwardKey,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActiveEnrollment } from "../school/school-enrollment-shared.server";
import { loadActorOrganizationId, lockPupilRow } from "../school/school-pupil-shared.server";
import { revalidateBricksCaches } from "../bricks/revalidate-bricks-cache";
import { buildAchievementRuleSnapshot } from "./achievement-award-snapshot.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { assertAwardManuallyAccess } from "./achievement-mutate-access.server";
import { loadGradeAchievementMode } from "./achievement-mode.server";

const awardManuallyInputSchema = z
  .object({
    pupilId: z.string().uuid(),
    achievementId: z.string().uuid(),
    tier: z.number().int().positive(),
    points: z.number().int().min(0),
    reason: z.string().trim().min(1, "teacher.achievements.reason_required"),
    checkIds: z.array(z.string().uuid()).default([]),
    academicYearId: z.string().uuid().optional(),
  })
  .strict();

export type AwardManuallySuccess = { awardId: string };

export async function awardManually(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<AwardManuallySuccess>> {
  const parsed = awardManuallyInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const bricksInvalidation = { pupilId: null as string | null, yearId: null as string | null };

  const result: MutationResult<AwardManuallySuccess> = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const access = await assertAwardManuallyAccess(tx, actorUserId, organizationId, parsed.data.pupilId);
    if (access) return access;

    const locked = await lockPupilRow(tx, parsed.data.pupilId);
    if (!locked) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const flagOn = await readFeaturesAchievementsEnabled(tx);
    if (!flagOn) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
        message: "admin.achievements.flag_off",
      };
    }

    const enrollment = await loadActiveEnrollment(tx, parsed.data.pupilId);
    if (!enrollment) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const academicYearId = parsed.data.academicYearId ?? enrollment.academicYearId;
    if (academicYearId !== enrollment.academicYearId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const mode = await loadGradeAchievementMode(tx, enrollment.gradeId, academicYearId);
    if (!mode?.achievementsEnabled) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_MODE_OFF,
        message: "teacher.achievements.mode_off",
      };
    }

    const achievement = await tx.achievement.findUnique({
      where: { id: parsed.data.achievementId },
      select: {
        id: true,
        code: true,
        kind: true,
        ruleType: true,
        metric: true,
        threshold: true,
        isActive: true,
        tiers: { where: { tier: parsed.data.tier } },
      },
    });
    if (!achievement || achievement.kind !== ACHIEVEMENT_KIND.REWARD) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    if (!achievement.isActive) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_INACTIVE,
        message: "teacher.achievements.inactive",
      };
    }

    const tierRow = achievement.tiers[0];
    if (!tierRow) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    if (parsed.data.points > tierRow.points) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_POINTS_EXCEED,
        message: "teacher.achievements.points_exceed",
      };
    }

    const needsEvidence = achievement.ruleType !== ACHIEVEMENT_RULE_TYPE.MANUAL;
    const checkIds = parsed.data.checkIds;
    if (needsEvidence && checkIds.length < tierRow.length) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_SHORT,
        message: "teacher.achievements.evidence_short",
      };
    }

    if (needsEvidence && checkIds.length > 0) {
      const checks = await tx.homeworkCheck.findMany({
        where: {
          id: { in: checkIds },
          pupilId: parsed.data.pupilId,
          homeworkChecked: true,
          lesson: { academicYearId },
        },
        select: { id: true },
      });
      if (checks.length !== checkIds.length) {
        return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
      }

      const occupied = await tx.achievementEvidence.findFirst({
        where: {
          achievementId: parsed.data.achievementId,
          tier: parsed.data.tier,
          checkId: { in: checkIds },
        },
        select: { id: true },
      });
      if (occupied) {
        return {
          ok: false,
          code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_TAKEN,
          message: "teacher.achievements.evidence_taken",
        };
      }
    }

    const existingLevel = await tx.achievementAward.findFirst({
      where: {
        pupilId: parsed.data.pupilId,
        achievementId: parsed.data.achievementId,
        tier: parsed.data.tier,
        academicYearId,
      },
      select: { id: true },
    });
    if (existingLevel) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_TAKEN,
        message: "teacher.achievements.evidence_taken",
      };
    }

    const awardedAt = new Date();
    const awardKey = buildAchievementAwardKey({
      pupilId: parsed.data.pupilId,
      achievementId: parsed.data.achievementId,
      tier: parsed.data.tier,
      academicYearId,
    });

    try {
      const award = await tx.achievementAward.create({
        data: {
          pupilId: parsed.data.pupilId,
          achievementId: parsed.data.achievementId,
          tier: parsed.data.tier,
          academicYearId,
          points: parsed.data.points,
          ruleSnapshot: buildAchievementRuleSnapshot(achievement, tierRow),
          source: AWARD_SOURCE.MANUAL,
          awardedById: actorUserId,
          reason: parsed.data.reason,
          awardedAt,
          awardKey,
          evidence:
            needsEvidence && checkIds.length > 0
              ? {
                  create: checkIds.map((checkId) => ({
                    achievementId: parsed.data.achievementId,
                    tier: parsed.data.tier,
                    checkId,
                  })),
                }
              : undefined,
        },
        select: { id: true },
      });

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT_AWARD,
        entityId: award.id,
        action: AUDIT_ACTION.ACHIEVEMENT_AWARDED,
        newValue: {
          awardId: award.id,
          pupilId: parsed.data.pupilId,
          achievementId: parsed.data.achievementId,
          tier: parsed.data.tier,
        },
      });

      bricksInvalidation.pupilId = parsed.data.pupilId;
      bricksInvalidation.yearId = academicYearId;
      return { ok: true, data: { awardId: award.id } };
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
  });

  if (result.ok && bricksInvalidation.pupilId && bricksInvalidation.yearId) {
    revalidateBricksCaches(bricksInvalidation.pupilId, bricksInvalidation.yearId);
  }
  return result;
}
