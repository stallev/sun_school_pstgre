import { CustomLink } from "@/components/ui/custom-link";
import type { PeopleGroupOption } from "@/data/people/load-people-admin-list.server";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import { buildPeopleListHref } from "@/lib/people/parse-people-filter";
import type { PeopleListFilter } from "@/data/people/people-list-filters";
import { cn } from "@/lib/utils";

type PeopleGroupFilterProps = {
  groups: readonly PeopleGroupOption[];
  activeGroupId: string | undefined;
  activeFilter: PeopleListFilter;
  displayQuery: string;
  messages: AdminMessages;
};

export const PeopleGroupFilter = ({
  groups,
  activeGroupId,
  activeFilter,
  displayQuery,
  messages,
}: PeopleGroupFilterProps) => (
  <div className="flex flex-wrap gap-chip" role="group" aria-label={messages.people.groupFilterLabel}>
    <CustomLink
      href={buildPeopleListHref({ filter: activeFilter, displayQuery, page: 1 })}
      aria-pressed={!activeGroupId}
      className={cn(
        "inline-flex h-9 items-center rounded-lg border px-card text-sm transition-[color,background-color,border-color] duration-100",
        !activeGroupId
          ? "border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink"
          : "border-line bg-surface text-ink-2 hover:bg-paper hover:text-ink",
      )}
    >
      {messages.people.groupFilterAll}
    </CustomLink>
    {groups.map((group) => {
      const isActive = activeGroupId === group.gradeId;
      return (
        <CustomLink
          key={group.gradeId}
          href={buildPeopleListHref({
            filter: activeFilter,
            groupId: group.gradeId,
            displayQuery,
            page: 1,
          })}
          aria-pressed={isActive}
          className={cn(
            "inline-flex h-9 items-center rounded-lg border px-card text-sm transition-[color,background-color,border-color] duration-100",
            isActive
              ? "border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink"
              : "border-line bg-surface text-ink-2 hover:bg-paper hover:text-ink",
          )}
        >
          {group.name}
        </CustomLink>
      );
    })}
  </div>
);
