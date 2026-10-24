import "server-only";

import { z } from "zod";
import {
  ACHIEVEMENT_KIND,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  PENALTY_STATUS,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActiveEnrollment } from "../school/school-enrollment-shared.server";
import { loadActorOrganizationId, lockPupilRow } from "../school/school-pupil-shared.server";
import { revalidateBricksCaches } from "../bricks/revalidate-bricks-cache";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { assertAwardManuallyAccess } from "./achievement-mutate-access.server";
import { loadGradeAchievementMode } from "./achievement-mode.server";
import {
  loadGroupAchievementPointsOverrides,
  resolvePenaltyCatalogPoints,
} from "./group-achievement-points.server";

const issuePenaltyInputSchema = z
  .object({
    pupilId: z.string().uuid(),
    achievementId: z.string().uuid(),
    lessonId: z.string().uuid(),
    points: z.number().int().negative(),
    reason: z.string().trim().min(1, "teacher.achievements.reason_required"),
  })
  .strict();

export type IssuePenaltySuccess = { penaltyId: string };

export async function issuePenalty(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<IssuePenaltySuccess>> {
  const parsed = issuePenaltyInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const bricksInvalidation = { pupilId: null as string | null, yearId: null as string | null };

  const result: MutationResult<IssuePenaltySuccess> = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const access = await assertAwardManuallyAccess(
      tx,
      actorUserId,
      organizationId,
      parsed.data.pupilId,
    );
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

    const mode = await loadGradeAchievementMode(tx, enrollment.gradeId, enrollment.academicYearId);
    if (!mode?.achievementsEnabled) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_MODE_OFF,
        message: "teacher.achievements.mode_off",
      };
    }

    const lesson = await tx.lesson.findFirst({
      where: {
        id: parsed.data.lessonId,
        academicYearId: enrollment.academicYearId,
        gradeId: enrollment.gradeId,
        grade: { organizationId },
      },
      select: { id: true, gradeId: true },
    });
    if (!lesson) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const achievement = await tx.achievement.findUnique({
      where: { id: parsed.data.achievementId },
      select: {
        id: true,
        kind: true,
        isActive: true,
        threshold: true,
        tiers: { where: { tier: 1 }, select: { points: true } },
      },
    });
    if (!achievement || achievement.kind !== ACHIEVEMENT_KIND.PENALTY) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    if (!achievement.isActive) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_INACTIVE,
        message: "teacher.achievements.inactive",
      };
    }

    const penaltyOverrides = await loadGroupAchievementPointsOverrides(
      tx,
      lesson.gradeId,
      enrollment.academicYearId,
    );
    const effectivePenalty = resolvePenaltyCatalogPoints(
      achievement.threshold,
      achievement.tiers[0]?.points,
      penaltyOverrides,
      achievement.id,
    );
    if (effectivePenalty === null) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    if (Math.abs(parsed.data.points) > Math.abs(effectivePenalty.points)) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.PENALTY_POINTS_EXCEED,
        message: "teacher.achievements.points_exceed",
      };
    }

    const existingActive = await tx.penalty.findFirst({
      where: {
        pupilId: parsed.data.pupilId,
        lessonId: parsed.data.lessonId,
        status: PENALTY_STATUS.ACTIVE,
      },
      select: { id: true },
    });
    if (existingActive) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.PENALTY_ONE_ACTIVE,
        message: "teacher.penalty.one_active",
      };
    }

    const issuedAt = new Date();
    try {
      const penalty = await tx.penalty.create({
        data: {
          pupilId: parsed.data.pupilId,
          achievementId: parsed.data.achievementId,
          lessonId: parsed.data.lessonId,
          points: parsed.data.points,
          reason: parsed.data.reason,
          issuedById: actorUserId,
          issuedAt,
          status: PENALTY_STATUS.ACTIVE,
        },
        select: { id: true },
      });

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.PENALTY,
        entityId: penalty.id,
        action: AUDIT_ACTION.PENALTY_ISSUED,
        newValue: {
          penaltyId: penalty.id,
          pupilId: parsed.data.pupilId,
          lessonId: parsed.data.lessonId,
          achievementId: parsed.data.achievementId,
        },
      });

      bricksInvalidation.pupilId = parsed.data.pupilId;
      bricksInvalidation.yearId = enrollment.academicYearId;
      return { ok: true, data: { penaltyId: penalty.id } };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return {
          ok: false,
          code: MUTATION_ERROR_CODES.PENALTY_ONE_ACTIVE,
          message: "teacher.penalty.one_active",
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
