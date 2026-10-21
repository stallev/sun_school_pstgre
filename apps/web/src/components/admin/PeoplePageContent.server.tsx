import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { PupilCardForm } from "@/components/admin/PupilCardForm";
import { PupilEntityHistoryList } from "@/components/admin/EntityHistoryList";
import { LegacyConsentList } from "@/components/admin/LegacyConsentList";
import { PeopleListFilterNav } from "@/components/admin/PeopleListFilter";
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

export type PeoplePageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export const PeoplePageContent = async ({ searchParams }: PeoplePageProps) => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const { filter: filterRaw } = await searchParams;
  const filter = parsePeopleListFilter(filterRaw);

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const defaultDate = isoTodayUtc();
  const [list, legacyPending] = await Promise.all([
    loadPeopleAdminList(prisma, filter),
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

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader title={adminMessages.page.peopleTitle} />
        <PeopleListFilterNav activeFilter={filter} messages={adminMessages} />
        <LegacyConsentList
          deadlineOn={legacyPending.deadlineOn}
          rows={legacyPending.rows}
          defaultNewDeadlineOn={legacyDefaultDeadline}
          dictionaries={dictionaries}
          formError={formError}
          closeLabel={closeLabel}
          messages={adminMessages}
        />
        <PupilCardForm dictionaries={dictionaries} formError={formError} mode="create" />
        {list.pupils.length === 0 ? (
          <EmptyState
            title={adminMessages.people.emptyTitle}
            description={adminMessages.people.emptyDescription}
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

