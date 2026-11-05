import { CustomLink } from "@/components/ui/custom-link";
import { nonEmptyTerm } from "@/components/ui/non-empty-term";
import { TermLabel } from "@/components/ui/term-label";
import { PEOPLE_LIST_FILTER, type PeopleListFilter } from "@/data/people/people-list-filters";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import { buildPeopleListHref } from "@/lib/people/parse-people-filter";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import { cn } from "@/lib/utils";

type PeopleListFilterNavProps = {
  activeFilter: PeopleListFilter;
  displayQuery: string;
  activeGroupId: string | undefined;
  messages: AdminMessages;
  pupilStatesHint: HintTerm;
  migratedHint: HintTerm;
};

const filterTabs: {
  key: PeopleListFilter;
  label: (messages: AdminMessages) => string;
  hint?: (hints: { pupilStatesHint: HintTerm; migratedHint: HintTerm }) => HintTerm | null;
}[] = [
  { key: PEOPLE_LIST_FILTER.ALL, label: (messages) => messages.people.filterAll },
  {
    key: PEOPLE_LIST_FILTER.UNASSIGNED,
    label: (messages) => messages.people.filterUnassigned,
    hint: ({ pupilStatesHint }) => pupilStatesHint,
  },
  {
    key: PEOPLE_LIST_FILTER.INACTIVE,
    label: (messages) => messages.people.filterInactive,
    hint: ({ pupilStatesHint }) => pupilStatesHint,
  },
  {
    key: PEOPLE_LIST_FILTER.LEGACY,
    label: (messages) => messages.people.filterLegacy,
    hint: ({ migratedHint }) => migratedHint,
  },
];

export const PeopleListFilterNav = ({
  activeFilter,
  displayQuery,
  activeGroupId,
  messages,
  pupilStatesHint,
  migratedHint,
}: PeopleListFilterNavProps) => (
  <nav
    className="-mb-px flex gap-1 overflow-x-auto border-b border-line"
    aria-label={messages.people.filterAll}
    role="tablist"
  >
    {filterTabs.map((tab) => {
      const isActive = activeFilter === tab.key;
      const href = buildPeopleListHref({
        filter: tab.key,
        groupId: activeGroupId,
        displayQuery,
        page: 1,
      });
      const hint = tab.hint?.({ pupilStatesHint, migratedHint }) ?? null;
      const label = tab.label(messages);
      return (
        <CustomLink
          key={tab.key}
          href={href}
          role="tab"
          aria-selected={isActive}
          className={cn(
            "-mb-px inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-sm transition-[color,border-color] duration-100",
            isActive
              ? "border-ink font-bold text-ink"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          {hint ? (
            <TermLabel
              term={nonEmptyTerm(label)}
              hint={hint.hint}
              ariaLabel={label}
              popoverSide="top"
            />
          ) : (
            label
          )}
        </CustomLink>
      );
    })}
  </nav>
);
