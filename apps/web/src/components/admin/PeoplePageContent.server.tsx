import { connection } from "next/server";
import { Suspense } from "react";
import { USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { LegacyConsentList } from "@/components/admin/LegacyConsentList";
import { PeopleAddPupilDialog } from "@/components/admin/PeopleAddPupilDialog.client";
import { PeopleGroupFilter } from "@/components/admin/PeopleGroupFilter";
import { PeopleListFilterNav } from "@/components/admin/PeopleListFilter";
import { PeopleSearch } from "@/components/admin/PeopleSearch.client";
import { PupilEntityHistoryList } from "@/components/admin/EntityHistoryList";
import { PupilRow } from "@/components/admin/PupilRow";
import { ShowMore } from "@/components/admin/ShowMore";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { readConsentTextVersionFromDb } from "@/data/access/consent-text-version.server";
import { loadPeopleAdminList } from "@/data/people/load-people-admin-list.server";
import { PEOPLE_LIST_FILTER } from "@/data/people/people-list-filters";
import {
  listLegacyPendingPupils,
  suggestNextLegacyDeadlineOn,
} from "@/data/school/list-legacy-pending";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { buildPeopleListHref, parsePeopleListQuery } from "@/lib/people/parse-people-filter";
import { nonEmptyTerm } from "@/components/ui/non-empty-term";
import { TermLabel } from "@/components/ui/term-label";
import { pickAdminHintsSubset } from "@/lib/messages/pick-admin-hints-messages.server";

export type PeoplePageProps = {
  searchParams: Promise<{ filter?: string; q?: string; group?: string; page?: string }>;
};

export const PeoplePageContent = async ({ searchParams }: PeoplePageProps) => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const rawParams = await searchParams;
  const query = parsePeopleListQuery(rawParams);

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const hints = pickAdminHintsSubset(adminDict, [
    "consent_paper",
    "consent_migrated",
    "pupil_states",
    "pupil_transfer",
  ] as const);
  const defaultDate = isoTodayUtc();
  const [list, legacyPending] = await Promise.all([
    loadPeopleAdminList(prisma, query),
    listLegacyPendingPupils(prisma),
  ]);
  const legacyDefaultDeadline =
    legacyPending.deadlineOn !== null
      ? suggestNextLegacyDeadlineOn(legacyPending.deadlineOn)
      : defaultDate;
  const consentTextVersion = await readConsentTextVersionFromDb(prisma);
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const closeLabel = adminMessages.form.cancel;
  const isLegacyTab = query.filter === PEOPLE_LIST_FILTER.LEGACY;
  const isSearchEmpty = Boolean(query.searchTerm) && list.totalMatching === 0;
  const showMoreHref = buildPeopleListHref({
    filter: query.filter,
    groupId: list.activeGroupId,
    page: list.page + 1,
    displayQuery: query.displayQuery,
  });

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader title={adminMessages.page.peopleTitle} />
        {!isLegacyTab ? (
          <>
            <Suspense fallback={null} key={query.displayQuery}>
              <PeopleSearch initialQuery={query.displayQuery} />
            </Suspense>
            <PeopleListFilterNav
              activeFilter={query.filter}
              displayQuery={query.displayQuery}
              activeGroupId={list.activeGroupId}
              messages={adminMessages}
              pupilStatesHint={hints.pupil_states}
              migratedHint={hints.consent_migrated}
            />
            {query.filter === PEOPLE_LIST_FILTER.ALL && legacyPending.rows.length > 0 ? (
              <p className="text-sm">
                <CustomLink href={buildPeopleListHref({ filter: PEOPLE_LIST_FILTER.LEGACY })}>
                  {adminMessages.people.legacyCountLink.replace(
                    "{count}",
                    String(legacyPending.rows.length),
                  )}
                </CustomLink>
              </p>
            ) : null}
            <PeopleGroupFilter
              groups={list.groups}
              activeGroupId={list.activeGroupId}
              activeFilter={query.filter}
              displayQuery={query.displayQuery}
              messages={adminMessages}
            />
            <PeopleAddPupilDialog
              dictionaries={dictionaries}
              uiLocale={locale}
              formError={formError}
            />
            {list.pupils.length === 0 ? (
              <EmptyState
                title={
                  isSearchEmpty
                    ? adminMessages.people.searchEmptyTitle
                    : adminMessages.people.emptyTitle
                }
                description={
                  isSearchEmpty
                    ? adminMessages.people.searchEmptyDescription
                    : adminMessages.people.emptyDescription
                }
              />
            ) : (
              <>
                <TermLabel
                  term={nonEmptyTerm(hints.consent_paper.term)}
                  hint={hints.consent_paper.hint}
                  ariaLabel={hints.consent_paper.term}
                  className="text-sm text-ink-2"
                  popoverSide="top"
                />
                <ul className="overflow-hidden rounded-xl border border-line bg-surface divide-y divide-line">
                  {list.pupils.map((row) => (
                    <PupilRow
                      key={row.pupilId}
                      row={row}
                      groups={list.groups}
                      consentTextVersion={consentTextVersion}
                      defaultDate={defaultDate}
                      dictionaries={dictionaries}
                      uiLocale={locale}
                      formError={formError}
                      closeLabel={closeLabel}
                      messages={adminMessages}
                      pupilTransferHint={hints.pupil_transfer}
                      historySlot={<PupilEntityHistoryList pupilId={row.pupilId} />}
                    />
                  ))}
                </ul>
                <ShowMore
                  href={showMoreHref}
                  remainingCount={list.remainingCount}
                  messages={adminMessages}
                />
              </>
            )}
          </>
        ) : (
          <>
            <PeopleListFilterNav
              activeFilter={query.filter}
              displayQuery={query.displayQuery}
              activeGroupId={list.activeGroupId}
              messages={adminMessages}
              pupilStatesHint={hints.pupil_states}
              migratedHint={hints.consent_migrated}
            />
            <LegacyConsentList
              deadlineOn={legacyPending.deadlineOn}
              rows={legacyPending.rows}
              defaultNewDeadlineOn={legacyDefaultDeadline}
              dictionaries={dictionaries}
              uiLocale={locale}
              formError={formError}
              closeLabel={closeLabel}
              messages={adminMessages}
              migratedHint={hints.consent_migrated}
            />
          </>
        )}
      </div>
    </AdminMessagesProvider>
  );
};
