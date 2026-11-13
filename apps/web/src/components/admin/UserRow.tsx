"use client";

import { ACCOUNT_STATUS } from "@sunschool/domain";
import { ChevronRight } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { Button } from "@/components/ui/button";
import { StatusText } from "@/components/ui/status-text";
import type { UserListRow } from "@/data/access/load-users-list.server";
import { resolveUserListPrimaryName } from "@/data/users/format-user-list-display";
import { formatAccountStatusLabel } from "@/lib/admin/format-account-status-label";
import { formatUserRolesLabel } from "@/lib/admin/format-user-roles-label";
import type { AdminMessages } from "@/lib/messages/admin-messages";

type UserRowProps = {
  row: UserListRow;
  messages: AdminMessages;
  disambiguator: string | null;
  needRoleLabel: string;
};

const statusTone = (status: UserListRow["status"]) => {
  if (status === ACCOUNT_STATUS.ACTIVE) return "ok";
  if (status === ACCOUNT_STATUS.DISABLED || status === ACCOUNT_STATUS.REJECTED) return "danger";
  if (status === ACCOUNT_STATUS.REQUEST_PENDING) return "warn";
  return "neutral";
};

const needsRoleAssignment = (row: UserListRow): boolean =>
  row.status === ACCOUNT_STATUS.REQUEST_PENDING ||
  (row.status === ACCOUNT_STATUS.ACTIVE && row.roles.length === 0);

export const UserRow = ({
  row,
  messages,
  disambiguator,
  needRoleLabel,
}: UserRowProps) => {
  const profileHref = `/users/${row.userId}`;
  const showNeedsRole = needsRoleAssignment(row);
  const primaryActionLabel = showNeedsRole
    ? messages.users.rowAssignRoles
    : messages.users.rowOpenProfile;
  const displayName = resolveUserListPrimaryName(row, {
    unnamed: messages.users.unnamed,
    adminWithoutName: messages.audit.adminWithoutName,
  });
  const statusLabel = formatAccountStatusLabel(row.status, messages);

  return (
    <li className="grid grid-cols-1 gap-stack px-card py-card md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_1.5rem] md:items-center md:gap-section">
      <CustomLink href={profileHref} className="min-w-0 hover:text-cobalt-ink">
        <ContentText className="block truncate font-medium text-ink">{displayName}</ContentText>
        {disambiguator ? (
          <ContentText tone="muted" className="block truncate text-sm">
            {disambiguator}
          </ContentText>
        ) : null}
      </CustomLink>
      <div className="flex flex-col gap-hint">
        {row.status === ACCOUNT_STATUS.ACTIVE && row.roles.length > 0 ? (
          <ContentText tone="secondary" className="text-sm">
            {formatUserRolesLabel(row.roles, messages)}
          </ContentText>
        ) : (
          <StatusText tone={statusTone(row.status)}>{statusLabel}</StatusText>
        )}
        {showNeedsRole ? (
          <ContentText tone="secondary" className="text-sm">
            {needRoleLabel}
          </ContentText>
        ) : null}
      </div>
      <Button
        variant={showNeedsRole ? "default" : "outline"}
        className="w-full md:w-auto"
        render={<CustomLink href={profileHref} />}
      >
        {primaryActionLabel}
      </Button>
      <ChevronRight className="hidden size-5 shrink-0 text-muted md:block" aria-hidden />
    </li>
  );
};
