"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { cancelDeletionRequest } from "@/data/deletions/cancel-request";
import { createChildDeletionRequest } from "@/data/deletions/create-child-request";
import { createDeletionRequest } from "@/data/deletions/create-request";
import { rejectDeletionRequest } from "@/data/deletions/reject-request";
import { takeDeletionRequest } from "@/data/deletions/take-request";
import { uuidFromForm } from "@/lib/auth/admin-access-form";
import { requireNonDeletedUser, requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";

const revalidateDeletionSurfaces = () => {
  revalidatePath("/deletions");
  revalidatePath("/profile");
};

export async function createDeletionRequestAction(
  _prev: MutationResult<{ requestId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ requestId: string }>> {
  const actor = await requireNonDeletedUser();
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  const raw = reasonRaw.length > 0 ? { reason: reasonRaw } : {};
  const result = await createDeletionRequest(
    await getPrisma(),
    actor.userId,
    raw,
    new Date(),
    await getSchoolTimezone(),
  );
  if (result.ok) revalidateDeletionSurfaces();
  return result;
}

export async function createChildDeletionRequestAction(
  _prev: MutationResult<{ requestId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ requestId: string }>> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    pupilId: uuidFromForm(formData, "pupilId"),
    guardianNote: String(formData.get("guardianNote") ?? "").trim(),
  };
  const result = await createChildDeletionRequest(
    await getPrisma(),
    actor.userId,
    raw,
    new Date(),
    await getSchoolTimezone(),
  );
  if (result.ok) revalidateDeletionSurfaces();
  return result;
}

export async function takeDeletionRequestAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = { requestId: uuidFromForm(formData, "requestId") };
  const result = await takeDeletionRequest(await getPrisma(), actor.userId, raw, new Date());
  if (result.ok) revalidateDeletionSurfaces();
  return result;
}

export async function cancelDeletionRequestAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireNonDeletedUser();
  const raw = { requestId: uuidFromForm(formData, "requestId") };
  const result = await cancelDeletionRequest(await getPrisma(), actor.userId, raw, new Date());
  if (result.ok) revalidateDeletionSurfaces();
  return result;
}

export async function rejectDeletionRequestAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    requestId: uuidFromForm(formData, "requestId"),
    reason: String(formData.get("reason") ?? "").trim(),
  };
  const result = await rejectDeletionRequest(await getPrisma(), actor.userId, raw, new Date());
  if (result.ok) revalidateDeletionSurfaces();
  return result;
}
