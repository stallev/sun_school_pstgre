import { ACCOUNT_STATUS } from "@sunschool/domain";
import { ChevronRight } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { StatusText } from "@/components/ui/status-text";
import type { UserListRow } from "@/data/access/load-users-list.server";
import { formatAccountStatusLabel } from "@/lib/admin/format-account-status-label";
import { formatUserRolesLabel } from "@/lib/admin/format-user-roles-label";
import type { AdminMessages } from "@/lib/messages/admin-messages";

type UserRowProps = {
  row: UserListRow;
  messages: AdminMessages;
};

const statusTone = (status: UserListRow["status"]) => {
  if (status === ACCOUNT_STATUS.ACTIVE) return "ok";
  if (status === ACCOUNT_STATUS.DISABLED || status === ACCOUNT_STATUS.REJECTED) return "danger";
  if (status === ACCOUNT_STATUS.REQUEST_PENDING) return "warn";
  return "neutral";
};

export const UserRow = ({ row, messages }: UserRowProps) => (
  <li>
    <CustomLink
      href={`/users/${row.userId}`}
      className="grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition-colors hover:bg-paper/70 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_1.5rem] md:items-center md:gap-6"
    >
      <span className="min-w-0">
        <ContentText className="block truncate font-medium text-ink">{row.displayName}</ContentText>
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {row.status === ACCOUNT_STATUS.ACTIVE ? (
          <ContentText tone="secondary" className="text-sm">
            {formatUserRolesLabel(row.roles, messages)}
          </ContentText>
        ) : (
          <StatusText tone={statusTone(row.status)}>
            {formatAccountStatusLabel(row.status, messages)}
          </StatusText>
        )}
      </span>
      <ChevronRight className="hidden size-5 shrink-0 text-muted md:block" aria-hidden />
    </CustomLink>
  </li>
);
