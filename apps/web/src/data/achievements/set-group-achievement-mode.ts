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
import { revalidateBricksCachesForPupils } from "../bricks/revalidate-bricks-cache";
import { assertSetGroupAchievementModeAccess } from "./achievement-mutate-access.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { evaluatePupilInTransaction } from "./evaluate-pupil";

const setGroupAchievementModeInputSchema = z
  .object({
    gradeId: z.string().uuid(),
    academicYearId: z.string().uuid(),
    enabled: z.boolean(),
  })
  .strict();

export type SetGroupAchievementModeSuccess = {
  achievementsEnabled: boolean;
  pupilsEvaluated: number;
  awardIds: string[];
};

export async function setGroupAchievementMode(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<SetGroupAchievementModeSuccess>> {
  const parsed = setGroupAchievementModeInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const bricksInvalidation = { pupilIds: null as string[] | null, yearId: null as string | null };

  const result: MutationResult<SetGroupAchievementModeSuccess> = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const access = await assertSetGroupAchievementModeAccess(
      tx,
      actorUserId,
      organizationId,
      parsed.data.gradeId,
      parsed.data.academicYearId,
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

    const settings = await tx.gradeSettings.findUnique({
      where: {
        gradeId_academicYearId: {
          gradeId: parsed.data.gradeId,
          academicYearId: parsed.data.academicYearId,
        },
      },
      select: { id: true, achievementsEnabled: true },
    });
    if (!settings) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const now = new Date();
    const targetEnabled = parsed.data.enabled;

    if (targetEnabled === settings.achievementsEnabled) {
      return {
        ok: true,
        data: { achievementsEnabled: settings.achievementsEnabled, pupilsEvaluated: 0, awardIds: [] },
      };
    }

    if (targetEnabled) {
      const closedOpenPeriods = await tx.gradeAchievementPeriod.updateMany({
        where: { gradeSettingsId: settings.id, endsAt: null },
        data: { endsAt: now },
      });

      if (closedOpenPeriods.count === 0) {
        const year = await tx.academicYear.findUnique({
          where: { id: parsed.data.academicYearId },
          select: { startsOn: true },
        });
        await tx.gradeAchievementPeriod.create({
          data: {
            gradeSettingsId: settings.id,
            startsAt: year?.startsOn ?? new Date(0),
            endsAt: now,
          },
        });
      }

      await tx.gradeSettings.update({
        where: { id: settings.id },
        data: { achievementsEnabled: true },
      });

      const enrollments = await tx.enrollment.findMany({
        where: {
          gradeId: parsed.data.gradeId,
          academicYearId: parsed.data.academicYearId,
          endsOn: null,
          pupil: { organizationId },
        },
        select: { pupilId: true },
      });

      const awardIds: string[] = [];
      for (const row of enrollments) {
        const result = await evaluatePupilInTransaction(
          tx,
          actorUserId,
          row.pupilId,
          parsed.data.academicYearId,
          parsed.data.gradeId,
        );
        awardIds.push(...result.awardIds);
      }

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.GRADE_SETTINGS,
        entityId: settings.id,
        action: AUDIT_ACTION.ACHIEVEMENT_MODE_CHANGED,
        newValue: { gradeId: parsed.data.gradeId, academicYearId: parsed.data.academicYearId, enabled: true },
      });

      bricksInvalidation.pupilIds = enrollments.map((row) => row.pupilId);
      bricksInvalidation.yearId = parsed.data.academicYearId;
      return {
        ok: true,
        data: {
          achievementsEnabled: true,
          pupilsEvaluated: enrollments.length,
          awardIds,
        },
      };
    }

    await tx.gradeSettings.update({
      where: { id: settings.id },
      data: { achievementsEnabled: false },
    });
    await tx.gradeAchievementPeriod.create({
      data: {
        gradeSettingsId: settings.id,
        startsAt: now,
        endsAt: null,
      },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.GRADE_SETTINGS,
      entityId: settings.id,
      action: AUDIT_ACTION.ACHIEVEMENT_MODE_CHANGED,
      newValue: { gradeId: parsed.data.gradeId, academicYearId: parsed.data.academicYearId, enabled: false },
    });

    return {
      ok: true,
      data: { achievementsEnabled: false, pupilsEvaluated: 0, awardIds: [] },
    };
  });

  if (result.ok && bricksInvalidation.pupilIds && bricksInvalidation.yearId) {
    revalidateBricksCachesForPupils(bricksInvalidation.pupilIds, bricksInvalidation.yearId);
  }
  return result;
}
