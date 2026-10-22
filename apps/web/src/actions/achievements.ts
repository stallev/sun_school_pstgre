"use server";

import { revalidatePath } from "next/cache";
import { ACHIEVEMENT_KIND, USER_ROLE, type MutationResult } from "@sunschool/domain";
import { recalculateAchievements } from "@/data/achievements/recalculate-achievements";
import type { RecalculateAchievementsSuccess } from "@/data/achievements/recalculate-achievements";
import { setAchievementActive } from "@/data/achievements/set-achievement-active";
import { upsertAchievement } from "@/data/achievements/upsert-achievement";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateAchievements = () => {
  revalidatePath("/achievements");
};

export async function recalculateAchievementsAction(
  _prev: MutationResult<RecalculateAchievementsSuccess> | null,
  _formData: FormData,
): Promise<MutationResult<RecalculateAchievementsSuccess>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await recalculateAchievements(await getPrisma(), actor.userId, {});
  if (result.ok) revalidateAchievements();
  return result;
}

export async function setAchievementActiveAction(
  raw: unknown,
): Promise<MutationResult<{ isActive: boolean }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await setAchievementActive(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateAchievements();
  return result;
}

export async function upsertRewardAchievementAction(
  _prev: MutationResult<{ achievementId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ achievementId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = Object.fromEntries(formData.entries());
  const tiers = [1, 2, 3]
    .map((tier) => {
      const length = formData.get(`tier_${tier}_length`);
      const points = formData.get(`tier_${tier}_points`);
      if (!length || String(length).trim() === "") return null;
      return { tier, length, points };
    })
    .filter((tier): tier is { tier: number; length: FormDataEntryValue; points: FormDataEntryValue } => tier !== null);

  const result = await upsertAchievement(
    await getPrisma(),
    actor.userId,
    { ...raw, tiers },
    ACHIEVEMENT_KIND.REWARD,
  );
  if (result.ok) revalidateAchievements();
  return result;
}

export async function upsertPenaltyCatalogAction(
  _prev: MutationResult<{ achievementId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ achievementId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = Object.fromEntries(formData.entries());
  const result = await upsertAchievement(
    await getPrisma(),
    actor.userId,
    raw,
    ACHIEVEMENT_KIND.PENALTY,
  );
  if (result.ok) revalidateAchievements();
  return result;
}
