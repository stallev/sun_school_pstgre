import { CustomLink } from "@/components/ui/custom-link";
import { PEOPLE_LIST_FILTER, type PeopleListFilter } from "@/data/school/load-people-admin-list.server";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import { cn } from "@/lib/utils";

type PeopleListFilterNavProps = {
  activeFilter: PeopleListFilter;
  messages: AdminMessages;
};

const filterTabs: { key: PeopleListFilter; href: string; label: (m: AdminMessages) => string }[] = [
  { key: PEOPLE_LIST_FILTER.ALL, href: "/people", label: (m) => m.people.filterAll },
  {
    key: PEOPLE_LIST_FILTER.UNASSIGNED,
    href: `/people?filter=${PEOPLE_LIST_FILTER.UNASSIGNED}`,
    label: (m) => m.people.filterUnassigned,
  },
  {
    key: PEOPLE_LIST_FILTER.INACTIVE,
    href: `/people?filter=${PEOPLE_LIST_FILTER.INACTIVE}`,
    label: (m) => m.people.filterInactive,
  },
];

export const PeopleListFilterNav = ({ activeFilter, messages }: PeopleListFilterNavProps) => (
  <nav
    className="-mb-px flex gap-1 overflow-x-auto border-b border-line"
    aria-label={messages.people.filterAll}
    role="tablist"
  >
    {filterTabs.map((tab) => {
      const isActive = activeFilter === tab.key;
      return (
        <CustomLink
          key={tab.key}
          href={tab.href}
          role="tab"
          aria-selected={isActive}
          className={cn(
            "-mb-px inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-[0.9375rem] transition-[color,border-color] duration-100",
            isActive
              ? "border-ink font-bold text-ink"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          {tab.label(messages)}
        </CustomLink>
      );
    })}
  </nav>
);
