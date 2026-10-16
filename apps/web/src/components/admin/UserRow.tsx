import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import type { UserListRow } from "@/data/access/load-users-list.server";
import { formatAccountStatusLabel } from "@/lib/admin/format-account-status-label";
import { formatUserRolesLabel } from "@/lib/admin/format-user-roles-label";
import type { AdminMessages } from "@/lib/messages/admin-messages";

type UserRowProps = {
  row: UserListRow;
  messages: AdminMessages;
};

export const UserRow = ({ row, messages }: UserRowProps) => (
  <CustomLink
    href={`/users/${row.userId}`}
    className="flex min-h-11 flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-paper md:flex-row md:items-center md:justify-between"
  >
    <ContentText className="font-medium text-ink">{row.displayName}</ContentText>
    <ContentText tone="secondary" className="text-sm">
      {formatAccountStatusLabel(row.status, messages)} · {formatUserRolesLabel(row.roles, messages)}
    </ContentText>
  </CustomLink>
);
