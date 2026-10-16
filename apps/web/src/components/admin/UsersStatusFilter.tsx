import { ACCOUNT_STATUS } from "@sunschool/domain";
import { CustomLink } from "@/components/ui/custom-link";
import { cn } from "@/lib/utils";
import type { AdminMessages } from "@/lib/messages/admin-messages";

type UsersStatusFilterProps = {
  activeStatus: string | null;
  messages: AdminMessages;
};

const filters: { param: string | null; label: (m: AdminMessages) => string }[] = [
  { param: null, label: (m) => m.users.filterAll },
  { param: ACCOUNT_STATUS.ACTIVE, label: (m) => m.users.filterActive },
  { param: ACCOUNT_STATUS.REQUEST_PENDING, label: (m) => m.users.filterPending },
  { param: ACCOUNT_STATUS.DISABLED, label: (m) => m.users.filterDisabled },
];

export const UsersStatusFilter = ({ activeStatus, messages }: UsersStatusFilterProps) => (
  <nav className="flex flex-wrap gap-2" aria-label={messages.users.filterAll}>
    {filters.map((filter) => {
      const href = filter.param ? `/users?status=${filter.param}` : "/users";
      const isActive = (filter.param ?? null) === (activeStatus ?? null);
      return (
        <CustomLink
          key={href}
          href={href}
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm",
            isActive ? "bg-cobalt-soft text-ink" : "bg-card text-muted-foreground hover:bg-paper",
          )}
        >
          {filter.label(messages)}
        </CustomLink>
      );
    })}
  </nav>
);
