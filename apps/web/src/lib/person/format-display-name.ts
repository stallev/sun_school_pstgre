import { ACCOUNT_STATUS, type AccountStatus } from "@sunschool/domain";

type NameParts = {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
};

/** Display order: last, first, middle (Russian convention). */
export const formatDisplayName = (parts: NameParts): string => {
  const segments = [parts.lastName, parts.firstName, parts.middleName].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return segments.join(" ");
};

/** Interpolate `{ordinal}` in the dictionary template (common.person.deleted_user). */
export const formatDeletedUserLabel = (ordinal: number, template: string): string =>
  template.replace("{ordinal}", String(ordinal));

export type AppUserDisplayInput = NameParts & {
  status: AccountStatus;
  deletedOrdinal?: number | null;
};

export const formatAppUserDisplayName = (
  user: AppUserDisplayInput,
  deletedUserTemplate: string,
): string => {
  if (user.status === ACCOUNT_STATUS.DELETED && user.deletedOrdinal != null) {
    return formatDeletedUserLabel(user.deletedOrdinal, deletedUserTemplate);
  }
  const name = formatDisplayName(user);
  return name.length > 0 ? name : "";
};
