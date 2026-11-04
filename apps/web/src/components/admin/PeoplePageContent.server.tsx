import { connection } from "next/server";
import { Suspense } from "react";
import { USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { PeopleAddPupilDialog } from "@/components/admin/PeopleAddPupilDialog.client";
import { PupilEntityHistoryList } from "@/components/admin/EntityHistoryList";
import { LegacyConsentList } from "@/components/admin/LegacyConsentList";
import { PeopleListFilterNav } from "@/components/admin/PeopleListFilter";
import { PeopleSearch } from "@/components/admin/PeopleSearch.client";
import { PupilRow } from "@/components/admin/PupilRow";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { readConsentTextVersionFromDb } from "@/data/access/consent-text-version.server";
import {
  loadPeopleAdminList,
  parsePeopleListFilter,
} from "@/data/school/load-people-admin-list.server";
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
import { parsePeopleSearchParam } from "@/lib/people/parse-people-search";

export type PeoplePageProps = {
  searchParams: Promise<{ filter?: string; q?: string }>;
};

export const PeoplePageContent = async ({ searchParams }: PeoplePageProps) => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const { filter: filterRaw, q: qRaw } = await searchParams;
  const filter = parsePeopleListFilter(filterRaw);
  const { searchTerm, displayQuery } = parsePeopleSearchParam(qRaw);

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const defaultDate = isoTodayUtc();
  const [list, legacyPending] = await Promise.all([
    loadPeopleAdminList(prisma, filter, searchTerm),
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
  const isSearchEmpty = Boolean(searchTerm) && list.pupils.length === 0;

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader title={adminMessages.page.peopleTitle} />
        <Suspense fallback={null} key={displayQuery}>
          <PeopleSearch initialQuery={displayQuery} />
        </Suspense>
        <PeopleListFilterNav
          activeFilter={filter}
          searchQuery={displayQuery}
          messages={adminMessages}
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
        />
        <PeopleAddPupilDialog
          dictionaries={dictionaries}
          uiLocale={locale}
          formError={formError}
        />
        {list.pupils.length === 0 ? (
          <EmptyState
            title={
              isSearchEmpty ? adminMessages.people.searchEmptyTitle : adminMessages.people.emptyTitle
            }
            description={
              isSearchEmpty
                ? adminMessages.people.searchEmptyDescription
                : adminMessages.people.emptyDescription
            }
          />
        ) : (
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
                historySlot={<PupilEntityHistoryList pupilId={row.pupilId} />}
              />
            ))}
          </ul>
        )}
      </div>
    </AdminMessagesProvider>
  );
};
