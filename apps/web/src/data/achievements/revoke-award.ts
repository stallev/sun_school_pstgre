import "server-only";

import { z } from "zod";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { revalidateBricksCaches } from "../bricks/revalidate-bricks-cache";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { assertRevokeAwardAccess } from "./achievement-mutate-access.server";

const revokeAwardInputSchema = z
  .object({
    awardId: z.string().uuid(),
    reason: z.string().trim().min(1, "teacher.achievements.reason_required"),
  })
  .strict();

export type RevokeAwardSuccess = { awardId: string };

export async function revokeAward(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<RevokeAwardSuccess>> {
  const parsed = revokeAwardInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const bricksInvalidation = { pupilId: null as string | null, yearId: null as string | null };

  const result: MutationResult<RevokeAwardSuccess> = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const access = await assertRevokeAwardAccess(tx, actorUserId);
    if (access) return access;

    const flagOn = await readFeaturesAchievementsEnabled(tx);
    if (!flagOn) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
        message: "admin.achievements.flag_off",
      };
    }

    const award = await tx.achievementAward.findFirst({
      where: {
        id: parsed.data.awardId,
        pupil: { organizationId },
      },
      select: { id: true, revokedAt: true, pupilId: true, academicYearId: true },
    });
    if (!award) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    if (award.revokedAt) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_ALREADY_REVOKED,
        message: "teacher.achievements.already_revoked",
      };
    }

    const revokedAt = new Date();
    await tx.achievementAward.update({
      where: { id: award.id },
      data: {
        revokedAt,
        revokedBy: actorUserId,
        revokedReason: parsed.data.reason,
      },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT_AWARD,
      entityId: award.id,
      action: AUDIT_ACTION.ACHIEVEMENT_REVOKED,
      newValue: { awardId: award.id, pupilId: award.pupilId },
    });

    bricksInvalidation.pupilId = award.pupilId;
    bricksInvalidation.yearId = award.academicYearId;
    return { ok: true, data: { awardId: award.id } };
  });

  if (result.ok && bricksInvalidation.pupilId && bricksInvalidation.yearId) {
    revalidateBricksCaches(bricksInvalidation.pupilId, bricksInvalidation.yearId);
  }
  return result;
}
