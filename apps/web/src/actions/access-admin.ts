"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { approveRequest } from "@/data/access/approve-request";
import { changeRoles } from "@/data/access/change-roles";
import { disableAccess } from "@/data/access/disable-access";
import { enableAccess } from "@/data/access/enable-access";
import { mergeUsers } from "@/data/access/merge-users";
import { rejectRequest } from "@/data/access/reject-request";
import { updateUserName } from "@/data/access/update-user-name";
import { gradeIdsFromForm, rolesFromForm, uuidFromForm } from "@/lib/auth/admin-access-form";
import { nameFieldsFromForm } from "@/lib/auth/name-fields-from-form";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateAdminSurfaces = (userId?: string) => {
  revalidatePath("/approvals");
  revalidatePath("/users");
  if (userId) revalidatePath(`/users/${userId}`);
};

export async function approveRequestAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    requestId: uuidFromForm(formData, "requestId"),
    roles: rolesFromForm(formData),
    gradeIds: gradeIdsFromForm(formData),
  };
  const result = await approveRequest(await getPrisma(), actor.userId, raw, new Date());
  if (result.ok) revalidateAdminSurfaces();
  return result;
}

export async function rejectRequestAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    requestId: uuidFromForm(formData, "requestId"),
    reason: String(formData.get("reason") ?? "").trim(),
  };
  const result = await rejectRequest(await getPrisma(), actor.userId, raw, new Date());
  if (result.ok) revalidateAdminSurfaces();
  return result;
}

export async function changeRolesAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    userId: uuidFromForm(formData, "userId"),
    roles: rolesFromForm(formData),
    gradeIds: gradeIdsFromForm(formData),
  };
  const result = await changeRoles(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateAdminSurfaces(raw.userId);
  return result;
}

export async function disableAccessAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const userId = uuidFromForm(formData, "userId");
  const result = await disableAccess(await getPrisma(), actor.userId, { userId });
  if (result.ok) revalidateAdminSurfaces(userId);
  return result;
}

export async function enableAccessAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const userId = uuidFromForm(formData, "userId");
  const result = await enableAccess(await getPrisma(), actor.userId, { userId });
  if (result.ok) revalidateAdminSurfaces(userId);
  return result;
}

export async function updateUserNameAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const reason = String(formData.get("reason") ?? "").trim();
  const raw = {
    userId: uuidFromForm(formData, "userId"),
    ...nameFieldsFromForm(formData),
    ...(reason.length > 0 ? { reason } : {}),
  };
  const result = await updateUserName(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateAdminSurfaces(raw.userId);
  return result;
}

export async function mergeUsersAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    keepUserId: uuidFromForm(formData, "keepUserId"),
    mergeUserId: uuidFromForm(formData, "mergeUserId"),
  };
  const result = await mergeUsers(await getPrisma(), actor.userId, raw);
  if (result.ok) revalidateAdminSurfaces(raw.keepUserId);
  return result;
}
