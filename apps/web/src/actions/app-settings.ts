"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { updateAppLanguage } from "@/data/settings/update-app-language";
import { updateSchoolTimezone } from "@/data/settings/update-school-timezone";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateSettings = () => {
  revalidatePath("/settings");
  revalidatePath("/school");
  revalidatePath("/", "layout");
};

export async function updateAppLanguageAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await updateAppLanguage(await getPrisma(), actor.userId, {
    locale: String(formData.get("locale") ?? "").trim(),
  });
  if (result.ok) revalidateSettings();
  return result;
}

export async function updateSchoolTimezoneAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await updateSchoolTimezone(await getPrisma(), actor.userId, {
    timeZone: String(formData.get("timeZone") ?? "").trim(),
  });
  if (result.ok) revalidateSettings();
  return result;
}
