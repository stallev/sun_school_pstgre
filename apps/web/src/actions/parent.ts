"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { cancelOwnChildDeletionRequest } from "@/data/families/cancel-own-child-deletion-request";
import { createOwnChildDeletionRequest } from "@/data/families/create-own-child-deletion-request";
import { giveElectronicConsent } from "@/data/families/give-electronic-consent";
import { revokeElectronicConsent } from "@/data/families/revoke-electronic-consent";
import { updateOwnAdultContacts } from "@/data/families/update-own-adult-contacts";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";

const revalidateParent = () => {
  revalidatePath("/child");
  revalidatePath("/child/data");
  revalidatePath("/child/consent");
};

const parsePhones = (formData: FormData): string[] => {
  const raw = formData.get("phones");
  if (!raw || String(raw).trim() === "") return [];
  return String(raw)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
};

export async function updateOwnAdultContactsAction(
  _prev: MutationResult<{ adultId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ adultId: string }>> {
  const actor = await requireRole(USER_ROLE.PARENT);
  const result = await updateOwnAdultContacts(await getPrisma(), actor.userId, {
    phones: parsePhones(formData),
    email: formData.get("email"),
  });
  if (result.ok) revalidateParent();
  return result;
}

export async function giveElectronicConsentAction(
  _prev: MutationResult<{ consentId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ consentId: string }>> {
  const actor = await requireRole(USER_ROLE.PARENT);
  const result = await giveElectronicConsent(await getPrisma(), actor.userId, {
    pupilId: formData.get("pupilId"),
    accepted: true,
  });
  if (result.ok) revalidateParent();
  return result;
}

export async function revokeElectronicConsentAction(
  _prev: MutationResult<{ requestId?: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ requestId?: string }>> {
  const actor = await requireRole(USER_ROLE.PARENT);
  const schoolTimeZone = await getSchoolTimezone();
  const result = await revokeElectronicConsent(
    await getPrisma(),
    actor.userId,
    {
      pupilId: formData.get("pupilId"),
      confirmDeletion: formData.get("confirmDeletion") === "true",
    },
    new Date(),
    schoolTimeZone,
  );
  if (result.ok) revalidateParent();
  return result;
}

export async function createOwnChildDeletionRequestAction(
  _prev: MutationResult<{ requestId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ requestId: string }>> {
  const actor = await requireRole(USER_ROLE.PARENT);
  const reason = formData.get("reason");
  const schoolTimeZone = await getSchoolTimezone();
  const result = await createOwnChildDeletionRequest(
    await getPrisma(),
    actor.userId,
    {
      pupilId: formData.get("pupilId"),
      reason: reason && String(reason).trim() !== "" ? String(reason) : undefined,
    },
    new Date(),
    schoolTimeZone,
  );
  if (result.ok) revalidateParent();
  return result;
}

export async function cancelOwnChildDeletionRequestAction(
  _prev: MutationResult<undefined> | null,
  formData: FormData,
): Promise<MutationResult<undefined>> {
  const actor = await requireRole(USER_ROLE.PARENT);
  const result = await cancelOwnChildDeletionRequest(
    await getPrisma(),
    actor.userId,
    { requestId: formData.get("requestId") },
    new Date(),
  );
  if (result.ok) revalidateParent();
  return result;
}
