"use server";

import { revalidatePath } from "next/cache";
import { APP_LOCALE, USER_ROLE, type MutationResult } from "@sunschool/domain";
import { assignTeacher } from "@/data/school/assign-teacher";
import { createGroup } from "@/data/school/create-group";
import { setGroupLanguage } from "@/data/school/set-group-language";
import { unassignTeacher } from "@/data/school/unassign-teacher";
import { updateGradeSettings } from "@/data/school/update-grade-settings";
import { uuidFromForm } from "@/lib/auth/admin-access-form";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateGroupSurfaces = (gradeId?: string) => {
  revalidatePath("/groups");
  revalidatePath("/school");
  if (gradeId) revalidatePath(`/groups/${gradeId}`);
};

const parseJsonRecord = (raw: string): Record<string, string | number> => {
  try {
    const parsed = JSON.parse(raw) as Record<string, string | number>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

export async function createGroupAction(
  _prev: MutationResult<{ gradeId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ gradeId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const ageMinRaw = String(formData.get("ageMin") ?? "").trim();
  const ageMaxRaw = String(formData.get("ageMax") ?? "").trim();
  const result = await createGroup(await getPrisma(), actor.userId, {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || undefined,
    ageMin: ageMinRaw ? Number(ageMinRaw) : undefined,
    ageMax: ageMaxRaw ? Number(ageMaxRaw) : undefined,
  });
  if (result.ok) revalidateGroupSurfaces(result.data.gradeId);
  return result;
}

export async function setGroupLanguageAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const gradeId = uuidFromForm(formData, "gradeId");
  const languageRaw = String(formData.get("language") ?? "").trim();
  const language =
    languageRaw === APP_LOCALE.EN || languageRaw === APP_LOCALE.RU ? languageRaw : APP_LOCALE.RU;
  const result = await setGroupLanguage(await getPrisma(), actor.userId, {
    gradeId,
    language,
  });
  if (result.ok) revalidateGroupSurfaces(gradeId);
  return result;
}

export async function updateGradeSettingsAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const gradeId = uuidFromForm(formData, "gradeId");
  const yearId = uuidFromForm(formData, "yearId");
  const result = await updateGradeSettings(await getPrisma(), actor.userId, {
    gradeId,
    yearId,
    useVerses: formData.get("useVerses") === "on",
    useTest: formData.get("useTest") === "on",
    useNotebook: formData.get("useNotebook") === "on",
    useSinging: formData.get("useSinging") === "on",
    maxVersesPerLesson: Number(formData.get("maxVersesPerLesson") ?? 0),
    recitationDaysN: Number(formData.get("recitationDaysN") ?? 1),
    labels: parseJsonRecord(String(formData.get("labelsJson") ?? "{}")) as Record<string, string>,
    weights: parseJsonRecord(String(formData.get("weightsJson") ?? "{}")) as Record<string, number>,
  });
  if (result.ok) revalidateGroupSurfaces(gradeId);
  return result;
}

export async function assignTeacherAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const gradeId = uuidFromForm(formData, "gradeId");
  const result = await assignTeacher(await getPrisma(), actor.userId, {
    userId: uuidFromForm(formData, "userId"),
    gradeId,
    yearId: uuidFromForm(formData, "yearId"),
  });
  if (result.ok) revalidateGroupSurfaces(gradeId);
  return result;
}

export async function unassignTeacherAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const gradeId = uuidFromForm(formData, "gradeId");
  const result = await unassignTeacher(await getPrisma(), actor.userId, {
    userId: uuidFromForm(formData, "userId"),
    gradeId,
    yearId: uuidFromForm(formData, "yearId"),
  });
  if (result.ok) revalidateGroupSurfaces(gradeId);
  return result;
}
