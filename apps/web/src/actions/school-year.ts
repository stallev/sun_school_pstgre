"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { activateYear } from "@/data/school/activate-year";
import { closeYear } from "@/data/school/close-year";
import { createYear } from "@/data/school/create-year";
import { uuidFromForm } from "@/lib/auth/admin-access-form";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateYearSurfaces = () => {
  revalidatePath("/year");
  revalidatePath("/school");
};

export async function createYearAction(
  _prev: MutationResult<{ yearId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ yearId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    startsOn: String(formData.get("startsOn") ?? "").trim(),
    endsOn: String(formData.get("endsOn") ?? "").trim(),
  };
  const result = await createYear(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateYearSurfaces();
  return result;
}

export async function activateYearAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await activateYear(await getPrisma(), actor.userId, {
    yearId: uuidFromForm(formData, "yearId"),
  });
  if (result.ok) revalidateYearSurfaces();
  return result;
}

export async function closeYearAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const reason = String(formData.get("reason") ?? "").trim();
  const result = await closeYear(await getPrisma(), actor.userId, {
    yearId: uuidFromForm(formData, "yearId"),
    ...(reason ? { reason } : {}),
  });
  if (result.ok) revalidateYearSurfaces();
  return result;
}
