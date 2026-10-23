"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { addFamilyAdult } from "@/data/families/add-family-adult";
import { attachPupil } from "@/data/families/attach-pupil";
import { detachFamilyPupil } from "@/data/families/detach-family-pupil";
import { removeFamilyAdult } from "@/data/families/remove-family-adult";
import { updateFamilyAdult } from "@/data/families/update-family-adult";
import { upsertFamily } from "@/data/families/upsert-family";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateFamily = (familyId?: string) => {
  revalidatePath("/family");
  if (familyId) revalidatePath(`/family?id=${familyId}`);
};

const parsePhones = (formData: FormData): string[] => {
  const raw = formData.get("phones");
  if (!raw || String(raw).trim() === "") return [];
  return String(raw)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
};

export async function upsertFamilyAction(
  _prev: MutationResult<{ familyId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ familyId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    familyId: formData.get("familyId"),
    name: formData.get("name"),
    address: formData.get("address"),
    note: formData.get("note"),
  };
  const result = await upsertFamily(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateFamily(String(formData.get("familyId") ?? ""));
  return result;
}

export async function createFamilyWithAdultAction(
  _prev: MutationResult<{ familyId: string; adultId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ familyId: string; adultId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    familyName: formData.get("familyName"),
    address: formData.get("address"),
    note: formData.get("note"),
    relation: formData.get("relation"),
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    phones: parsePhones(formData),
    email: formData.get("email"),
  };
  const result = await addFamilyAdult(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateFamily(result.data.familyId);
  return result;
}

export async function addFamilyAdultAction(
  _prev: MutationResult<{ familyId: string; adultId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ familyId: string; adultId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    familyId: formData.get("familyId"),
    relation: formData.get("relation"),
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    phones: parsePhones(formData),
    email: formData.get("email"),
  };
  const result = await addFamilyAdult(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateFamily(result.data.familyId);
  return result;
}

export async function updateFamilyAdultAction(
  _prev: MutationResult<{ adultId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ adultId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    adultId: formData.get("adultId"),
    relation: formData.get("relation"),
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    phones: parsePhones(formData),
    email: formData.get("email"),
  };
  const result = await updateFamilyAdult(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateFamily(String(formData.get("familyId") ?? ""));
  return result;
}

export async function removeFamilyAdultAction(
  _prev: MutationResult<undefined> | null,
  formData: FormData,
): Promise<MutationResult<undefined>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = { adultId: formData.get("adultId") };
  const result = await removeFamilyAdult(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateFamily(String(formData.get("familyId") ?? ""));
  return result;
}

export async function attachFamilyPupilAction(
  _prev: MutationResult<{ pupilId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ pupilId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    familyId: formData.get("familyId"),
    pupilId: formData.get("pupilId"),
  };
  const result = await attachPupil(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateFamily(String(formData.get("familyId") ?? ""));
  return result;
}

export async function detachFamilyPupilAction(
  _prev: MutationResult<{ pupilId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ pupilId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = { pupilId: formData.get("pupilId") };
  const result = await detachFamilyPupil(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateFamily(String(formData.get("familyId") ?? ""));
  return result;
}
