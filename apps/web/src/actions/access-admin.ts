"use server";

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

export async function approveRequestAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    requestId: uuidFromForm(formData, "requestId"),
    roles: rolesFromForm(formData),
    gradeIds: gradeIdsFromForm(formData),
  };
  return approveRequest(await getPrisma(), actor.userId, raw, new Date());
}

export async function rejectRequestAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    requestId: uuidFromForm(formData, "requestId"),
    reason: String(formData.get("reason") ?? "").trim(),
  };
  return rejectRequest(await getPrisma(), actor.userId, raw, new Date());
}

export async function changeRolesAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    userId: uuidFromForm(formData, "userId"),
    roles: rolesFromForm(formData),
    gradeIds: gradeIdsFromForm(formData),
  };
  return changeRoles(await getPrisma(), actor.userId, raw);
}

export async function disableAccessAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  return disableAccess(await getPrisma(), actor.userId, { userId: uuidFromForm(formData, "userId") });
}

export async function enableAccessAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  return enableAccess(await getPrisma(), actor.userId, { userId: uuidFromForm(formData, "userId") });
}

export async function updateUserNameAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const reason = String(formData.get("reason") ?? "").trim();
  const raw = {
    userId: uuidFromForm(formData, "userId"),
    ...nameFieldsFromForm(formData),
    ...(reason.length > 0 ? { reason } : {}),
  };
  return updateUserName(await getPrisma(), actor.userId, raw);
}

export async function mergeUsersAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const raw = {
    keepUserId: uuidFromForm(formData, "keepUserId"),
    mergeUserId: uuidFromForm(formData, "mergeUserId"),
  };
  return mergeUsers(await getPrisma(), actor.userId, raw);
}
