import { z } from "zod";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { USER_ROLE, type UserRole } from "../constants/user-role";
import type { MutationErr } from "../types/mutation-result";
import { approveParentLinkInputSchema } from "./parent-approval";
import { personNameSchema } from "./person-name";

/** Roles the client may submit; `PARENT` is rejected when `features.parents` is off (access_requests §5.4). */
const requestedRoleSchema = z.enum([USER_ROLE.ADMIN, USER_ROLE.TEACHER, USER_ROLE.PARENT]);

export const parentRoleUnavailableIfRequested = (
  roles: readonly UserRole[],
  parentsFeatureEnabled = false,
): MutationErr | null => {
  if (parentsFeatureEnabled) return null;
  if (roles.includes(USER_ROLE.PARENT)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_ROLE_UNAVAILABLE,
      message: "admin.approvals.parent_unavailable",
    };
  }
  return null;
};

export const assignableRolesSchema = z
  .array(requestedRoleSchema)
  .min(1, { error: "admin.approvals.roles_required" });

const gradeIdsSchema = z
  .array(z.uuid())
  .optional()
  .default([])
  .transform((ids) => [...new Set(ids)]);

export const approveRequestInputSchema = z
  .object({
    requestId: z.uuid(),
    roles: assignableRolesSchema,
    gradeIds: gradeIdsSchema,
    parentLink: approveParentLinkInputSchema.optional(),
  })
  .strict();

export type ApproveRequestInput = z.infer<typeof approveRequestInputSchema>;

export const rejectRequestInputSchema = z
  .object({
    requestId: z.uuid(),
    reason: z
      .string()
      .trim()
      .min(1, { error: "common.errors.reason_required" })
      .max(500),
  })
  .strict();

export type RejectRequestInput = z.infer<typeof rejectRequestInputSchema>;

export const changeRolesInputSchema = z
  .object({
    userId: z.uuid(),
    roles: assignableRolesSchema,
    gradeIds: gradeIdsSchema,
  })
  .strict();

export type ChangeRolesInput = z.infer<typeof changeRolesInputSchema>;

export const userIdInputSchema = z.object({ userId: z.uuid() }).strict();

export type UserIdInput = z.infer<typeof userIdInputSchema>;

export const updateUserNameInputSchema = personNameSchema
  .extend({
    userId: z.uuid(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export type UpdateUserNameInput = z.infer<typeof updateUserNameInputSchema>;

export const mergeUsersInputSchema = z
  .object({
    keepUserId: z.uuid(),
    mergeUserId: z.uuid(),
  })
  .strict()
  .refine((value) => value.keepUserId !== value.mergeUserId, {
    error: "admin.users.merge_same",
    path: ["mergeUserId"],
  });

export type MergeUsersInput = z.infer<typeof mergeUsersInputSchema>;
