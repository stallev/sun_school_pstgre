import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { formatUserRolesLabel } from "@/lib/admin/format-user-roles-label";
import type { AdminMessages } from "@/lib/messages/admin-messages";

export type UserListDisplayInput = {
  userId: string;
  displayName: string;
  contactEmail: string | null;
  roles: UserRole[];
};

export type UserListDisplayLabels = Pick<AdminMessages["users"], "unnamed"> & {
  adminWithoutName: string;
};

export const resolveUserListPrimaryName = (
  row: Pick<UserListDisplayInput, "displayName" | "roles">,
  labels: UserListDisplayLabels,
): string => {
  const trimmed = row.displayName.trim();
  if (trimmed.length > 0) return trimmed;
  if (row.roles.includes(USER_ROLE.ADMIN)) return labels.adminWithoutName;
  return labels.unnamed;
};

const normalizeDisplayKey = (name: string): string => name.trim().toLocaleLowerCase("ru");

export const buildUserListDisambiguators = (
  rows: readonly UserListDisplayInput[],
  messages: AdminMessages,
  labels: UserListDisplayLabels,
): Map<string, string | null> => {
  const primaryNames = rows.map((row) => resolveUserListPrimaryName(row, labels));
  const counts = new Map<string, number>();
  for (const name of primaryNames) {
    const key = normalizeDisplayKey(name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result = new Map<string, string | null>();
  for (const row of rows) {
    const primaryName = resolveUserListPrimaryName(row, labels);
    const key = normalizeDisplayKey(primaryName);
    if ((counts.get(key) ?? 0) <= 1) {
      result.set(row.userId, null);
      continue;
    }
    if (row.contactEmail) {
      result.set(row.userId, row.contactEmail);
      continue;
    }
    if (row.roles.length > 0) {
      result.set(row.userId, formatUserRolesLabel(row.roles, messages));
      continue;
    }
    result.set(row.userId, null);
  }
  return result;
};
