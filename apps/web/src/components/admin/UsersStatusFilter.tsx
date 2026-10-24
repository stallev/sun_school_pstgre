import { ACCOUNT_STATUS, type AccountStatus } from "@sunschool/domain";
import { CustomLink } from "@/components/ui/custom-link";
import type { UsersStatusCounts } from "@/data/access/load-users-list.server";
import { cn } from "@/lib/utils";
import type { AdminMessages } from "@/lib/messages/admin-messages";

type UsersStatusFilterProps = {
  activeStatus: AccountStatus | null;
  counts: UsersStatusCounts;
  messages: AdminMessages;
};

const statusTabs: { param: AccountStatus | null; label: (m: AdminMessages) => string }[] = [
  { param: ACCOUNT_STATUS.ACTIVE, label: (m) => m.users.filterActive },
  { param: ACCOUNT_STATUS.REQUEST_PENDING, label: (m) => m.users.filterPending },
  { param: ACCOUNT_STATUS.REGISTRATION, label: (m) => m.users.filterRegistration },
  { param: ACCOUNT_STATUS.REJECTED, label: (m) => m.users.filterRejected },
  { param: ACCOUNT_STATUS.DISABLED, label: (m) => m.users.filterDisabled },
];

const countForTab = (counts: UsersStatusCounts, status: AccountStatus | null): number =>
  status === null ? counts.total : counts[status];

export const UsersStatusFilter = ({ activeStatus, counts, messages }: UsersStatusFilterProps) => (
  <nav
    className="-mb-px flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line"
    aria-label={messages.users.tabNav}
    role="tablist"
  >
    <CustomLink
      href="/users"
      role="tab"
      aria-selected={activeStatus === null}
      className={cn(
        "-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-base transition-[color,border-color] duration-100",
        activeStatus === null
          ? "border-ink font-bold text-ink"
          : "border-transparent text-ink-2 hover:text-ink",
      )}
    >
      {messages.users.filterAll}
      <span className="tabular-nums text-muted">{counts.total}</span>
    </CustomLink>
    {statusTabs.map((filter) => {
      const href = `/users?status=${filter.param}`;
      const isActive = activeStatus === filter.param;
      const tabCount = countForTab(counts, filter.param);
      return (
        <CustomLink
          key={filter.param}
          href={href}
          role="tab"
          aria-selected={isActive}
          className={cn(
            "-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-base transition-[color,border-color] duration-100",
            isActive
              ? "border-ink font-bold text-ink"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          {filter.label(messages)}
          <span className="tabular-nums text-muted">{tabCount}</span>
        </CustomLink>
      );
    })}
  </nav>
);
