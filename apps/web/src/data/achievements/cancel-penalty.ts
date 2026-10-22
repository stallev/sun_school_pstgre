import "server-only";

import { z } from "zod";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  PENALTY_STATUS,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { userHasAdminRole } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { assertAwardManuallyAccess } from "./achievement-mutate-access.server";

const cancelPenaltyInputSchema = z
  .object({
    penaltyId: z.string().uuid(),
    reason: z.string().trim().min(1, "teacher.achievements.reason_required"),
  })
  .strict();

export type CancelPenaltySuccess = { penaltyId: string };

export async function cancelPenalty(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<CancelPenaltySuccess>> {
  const parsed = cancelPenaltyInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
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

    const penalty = await tx.penalty.findFirst({
      where: {
        id: parsed.data.penaltyId,
        pupil: { organizationId },
      },
      select: {
        id: true,
        pupilId: true,
        lessonId: true,
        status: true,
        lesson: {
          select: {
            academicYear: { select: { status: true } },
          },
        },
      },
    });
    if (!penalty) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const access = await assertAwardManuallyAccess(
      tx,
      actorUserId,
      organizationId,
      penalty.pupilId,
    );
    if (access) return access;

    if (penalty.status !== PENALTY_STATUS.ACTIVE) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.PENALTY_ALREADY_CANCELLED,
        message: "teacher.penalty.already_cancelled",
      };
    }

    const isAdmin = await userHasAdminRole(tx, actorUserId);
    if (
      !isAdmin &&
      penalty.lesson.academicYear.status === ACADEMIC_YEAR_STATUS.CLOSED
    ) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.PENALTY_YEAR_CLOSED,
        message: "teacher.penalty.year_closed",
      };
    }

    const cancelledAt = new Date();
    await tx.penalty.update({
      where: { id: penalty.id },
      data: {
        status: PENALTY_STATUS.CANCELLED,
        cancelledAt,
        cancelledBy: actorUserId,
        cancelledReason: parsed.data.reason,
      },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.PENALTY,
      entityId: penalty.id,
      action: AUDIT_ACTION.PENALTY_CANCELLED,
      newValue: {
        penaltyId: penalty.id,
        pupilId: penalty.pupilId,
        lessonId: penalty.lessonId,
      },
    });

    return { ok: true, data: { penaltyId: penalty.id } };
  });
}
