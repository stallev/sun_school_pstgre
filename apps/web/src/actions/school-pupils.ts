"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { createPupil } from "@/data/school/create-pupil";
import { deactivatePupil } from "@/data/school/deactivate-pupil";
import { enrollPupil } from "@/data/school/enroll-pupil";
import { extendLegacyDeadline } from "@/data/school/extend-legacy-deadline";
import { recordPaperConsent } from "@/data/school/record-paper-consent";
import { transferPupil } from "@/data/school/transfer-pupil";
import { unenrollPupil } from "@/data/school/unenroll-pupil";
import { updatePupil } from "@/data/school/update-pupil";
import { uuidFromForm } from "@/lib/auth/admin-access-form";
import { requireActiveUser, requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidatePeople = () => {
  revalidatePath("/people");
  revalidatePath("/group");
  revalidatePath("/school");
  revalidatePath("/", "layout");
};

export async function createPupilAction(
  _prev: MutationResult<{ pupilId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ pupilId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await createPupil(await getPrisma(), actor.userId, {
    lastName: String(formData.get("lastName") ?? "").trim(),
    firstName: String(formData.get("firstName") ?? "").trim(),
    middleName: String(formData.get("middleName") ?? "").trim() || undefined,
    birthDate: String(formData.get("birthDate") ?? "").trim(),
    isActive: true,
  });
  if (result.ok) revalidatePeople();
  return result;
}

export async function updatePupilAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await updatePupil(await getPrisma(), actor.userId, {
    pupilId: uuidFromForm(formData, "pupilId"),
    lastName: String(formData.get("lastName") ?? "").trim(),
    firstName: String(formData.get("firstName") ?? "").trim(),
    middleName: String(formData.get("middleName") ?? "").trim() || undefined,
    birthDate: String(formData.get("birthDate") ?? "").trim(),
    isActive: formData.get("isActive") === "on",
  });
  if (result.ok) revalidatePeople();
  return result;
}

export async function deactivatePupilAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await deactivatePupil(await getPrisma(), actor.userId, {
    pupilId: uuidFromForm(formData, "pupilId"),
  });
  if (result.ok) revalidatePeople();
  return result;
}

export async function extendLegacyDeadlineAction(
  _prev: MutationResult<{ deadlineOn: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ deadlineOn: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await extendLegacyDeadline(await getPrisma(), actor.userId, {
    newDeadlineOn: String(formData.get("newDeadlineOn") ?? "").trim(),
    reason: String(formData.get("reason") ?? "").trim(),
  });
  if (result.ok) revalidatePeople();
  return result;
}

export async function recordPaperConsentAction(
  _prev: MutationResult<{ consentId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ consentId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const storageRaw = String(formData.get("storageNote") ?? "").trim();
  const result = await recordPaperConsent(await getPrisma(), actor.userId, {
    pupilId: uuidFromForm(formData, "pupilId"),
    signerName: String(formData.get("signerName") ?? "").trim(),
    signedOn: String(formData.get("signedOn") ?? "").trim(),
    textVersion: String(formData.get("textVersion") ?? "").trim(),
    storageNote: storageRaw || undefined,
  });
  if (result.ok) revalidatePeople();
  return result;
}

export async function enrollPupilAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireActiveUser();
  const result = await enrollPupil(await getPrisma(), actor.userId, {
    pupilId: uuidFromForm(formData, "pupilId"),
    gradeId: uuidFromForm(formData, "gradeId"),
    startsOn: String(formData.get("startsOn") ?? "").trim(),
  });
  if (result.ok) revalidatePeople();
  return result;
}

export async function unenrollPupilAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireActiveUser();
  const result = await unenrollPupil(await getPrisma(), actor.userId, {
    pupilId: uuidFromForm(formData, "pupilId"),
    endsOn: String(formData.get("endsOn") ?? "").trim(),
  });
  if (result.ok) revalidatePeople();
  return result;
}

export async function transferPupilAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const result = await transferPupil(await getPrisma(), actor.userId, {
    pupilId: uuidFromForm(formData, "pupilId"),
    toGradeId: uuidFromForm(formData, "toGradeId"),
    onDate: String(formData.get("onDate") ?? "").trim(),
  });
  if (result.ok) revalidatePeople();
  return result;
}
