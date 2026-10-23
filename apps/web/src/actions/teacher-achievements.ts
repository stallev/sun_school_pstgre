"use server";

import { revalidatePath } from "next/cache";
import { MUTATION_ERROR_CODES, USER_ROLE, type MutationResult } from "@sunschool/domain";
import { assertAwardManuallyAccess } from "@/data/achievements/achievement-mutate-access.server";
import { awardManually } from "@/data/achievements/award-manually";
import { cancelPenalty } from "@/data/achievements/cancel-penalty";
import { issuePenalty } from "@/data/achievements/issue-penalty";
import { revokeAward } from "@/data/achievements/revoke-award";
import { setGroupAchievementMode } from "@/data/achievements/set-group-achievement-mode";
import {
  loadManualAwardEvidence,
  type ManualAwardEvidenceOption,
} from "@/data/achievements/load-manual-award-form.server";
import { loadActorOrganizationId } from "@/data/school/school-pupil-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";

const revalidateAchievementSurfaces = () => {
  revalidatePath("/today");
  revalidatePath("/group");
  revalidatePath("/bricks");
  revalidatePath("/rating");
  revalidatePath("/analytics/pupils/[pupilId]", "page");
  revalidatePath("/groups/[groupId]", "page");
};

export async function setGroupAchievementModeAction(
  raw: unknown,
): Promise<MutationResult<{ achievementsEnabled: boolean }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const result = await setGroupAchievementMode(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateAchievementSurfaces();
  return result.ok
    ? { ok: true, data: { achievementsEnabled: result.data.achievementsEnabled } }
    : result;
}

export async function awardManuallyFormAction(
  _prev: MutationResult<{ awardId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ awardId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const checkIds = formData.getAll("checkIds").map(String);
  const raw = {
    pupilId: formData.get("pupilId"),
    achievementId: formData.get("achievementId"),
    tier: Number(formData.get("tier")),
    points: Number(formData.get("points")),
    reason: formData.get("reason"),
    academicYearId: formData.get("academicYearId") || undefined,
    checkIds,
  };
  const result = await awardManually(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateAchievementSurfaces();
  return result;
}

export async function revokeAwardFormAction(
  _prev: MutationResult<{ awardId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ awardId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await revokeAward(await getPrisma(), actor.userId, {
    awardId: formData.get("awardId"),
    reason: formData.get("reason"),
  });
  if (result.ok) revalidateAchievementSurfaces();
  return result;
}

export async function issuePenaltyFormAction(
  _prev: MutationResult<{ penaltyId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ penaltyId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const result = await issuePenalty(await getPrisma(), actor.userId, {
    pupilId: formData.get("pupilId"),
    achievementId: formData.get("achievementId"),
    lessonId: formData.get("lessonId"),
    points: Number(formData.get("points")),
    reason: formData.get("reason"),
  });
  if (result.ok) revalidateAchievementSurfaces();
  return result;
}

export async function loadManualAwardEvidenceAction(input: {
  pupilId: string;
  achievementId: string;
  tier: number;
  academicYearId: string;
}): Promise<MutationResult<{ need: number; options: ManualAwardEvidenceOption[] }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const db = await getPrisma();

  const accessGate = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actor.userId);
    if (!organizationId) {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.NOT_FOUND,
        message: "common.errors.not_found",
      };
    }
    const access = await assertAwardManuallyAccess(
      tx,
      actor.userId,
      organizationId,
      input.pupilId,
    );
    if (access) return access;
    return { ok: true as const };
  });

  if (!accessGate.ok) return accessGate;

  const locale = await getUiLocale();
  const timeZone = await getSchoolTimezone();
  const payload = await loadManualAwardEvidence(
    db,
    input.pupilId,
    input.achievementId,
    input.tier,
    input.academicYearId,
    locale,
    timeZone,
  );
  return { ok: true, data: payload };
}

export async function cancelPenaltyFormAction(
  _prev: MutationResult<{ penaltyId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ penaltyId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const result = await cancelPenalty(await getPrisma(), actor.userId, {
    penaltyId: formData.get("penaltyId"),
    reason: formData.get("reason"),
  });
  if (result.ok) revalidateAchievementSurfaces();
  return result;
}
