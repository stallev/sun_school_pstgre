import "server-only";

import { z } from "zod";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { assertAdminActor } from "../school/school-enrollment-shared.server";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { PRACTICE_ACHIEVEMENT_CODE } from "@/lib/achievements/catalog-display";

const setAchievementActiveSchema = z
  .object({
    achievementId: z.string().uuid(),
    isActive: z.boolean(),
  })
  .strict();

export async function setAchievementActiveInTransaction(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  organizationId: string,
  input: z.infer<typeof setAchievementActiveSchema>,
): Promise<MutationResult<{ isActive: boolean }>> {
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

  const achievement = await tx.achievement.findUnique({
    where: { id: input.achievementId },
    select: { id: true, code: true, isActive: true },
  });
  if (!achievement) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  if (achievement.code === PRACTICE_ACHIEVEMENT_CODE && input.isActive) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.achievements.practice_cannot_enable",
    };
  }

  if (achievement.isActive === input.isActive) {
    return { ok: true, data: { isActive: achievement.isActive } };
  }

  await tx.achievement.update({
    where: { id: achievement.id },
    data: { isActive: input.isActive },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT,
    entityId: achievement.id,
    action: AUDIT_ACTION.ACHIEVEMENT_CATALOG_TOGGLED,
    newValue: { isActive: input.isActive },
  });

  return { ok: true, data: { isActive: input.isActive } };
}

export async function setAchievementActive(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ isActive: boolean }>> {
  const parsed = setAchievementActiveSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return setAchievementActiveInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
