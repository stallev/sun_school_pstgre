"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { saveChecked } from "@/data/checks/save-checked";
import { savePartialCheck } from "@/data/checks/save-partial-check";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateCheckSurfaces = (lessonId: string) => {
  revalidatePath("/lessons");
  revalidatePath("/today");
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath(`/lessons/${lessonId}/check`);
  revalidatePath(`/lessons/${lessonId}/table`);
};

const lessonIdFromPayload = (raw: unknown): string | null => {
  if (!raw || typeof raw !== "object" || !("lessonId" in raw)) return null;
  const lessonId = (raw as { lessonId: unknown }).lessonId;
  return typeof lessonId === "string" ? lessonId : null;
};

export async function savePartialCheckAction(
  raw: unknown,
): Promise<MutationResult<{ checkId: string; updatedAt: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const result = await savePartialCheck(await getPrisma(), actor.userId, raw);
  if (result.ok) {
    const lessonId = lessonIdFromPayload(raw);
    if (lessonId) revalidateCheckSurfaces(lessonId);
  }
  return result;
}

export async function saveCheckedAction(
  raw: unknown,
): Promise<MutationResult<{ checkId: string; updatedAt: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const result = await saveChecked(await getPrisma(), actor.userId, raw);
  if (result.ok) {
    const lessonId = lessonIdFromPayload(raw);
    if (lessonId) revalidateCheckSurfaces(lessonId);
  }
  return result;
}
